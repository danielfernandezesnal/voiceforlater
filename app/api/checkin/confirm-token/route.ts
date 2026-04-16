import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

/**
 * POST /api/checkin/confirm-token
 * Confirms a user's check-in via a one-time token included in the reminder email.
 * Does NOT require the user to be logged in ?" the token proves identity.
 */
export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token || typeof token !== "string") {
            return NextResponse.json({ error: "Token required" }, { status: 400 });
        }

        // Hash the raw token to look it up in the DB (we store hashes, not raw tokens)
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        const supabase = getAdminClient();

        // Find the token ?" must be a reminder-1 action and not expired
        const { data: tokenRecord, error: tokenError } = await supabase
            .from("verification_tokens")
            .select("*")
            .eq("token_hash", tokenHash)
            .eq("action", "user-checkin-reminder-1")
            .single();

        if (tokenError || !tokenRecord) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
        }

        const now = new Date();
        if (new Date(tokenRecord.expires_at) < now) {
            return NextResponse.json({ error: "Token expired" }, { status: 400 });
        }

        const userId = tokenRecord.user_id;

        // Get the user's checkin record to know the interval
        const { data: checkin } = await supabase
            .from("checkins")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (!checkin) {
            return NextResponse.json({ error: "No active check-in found" }, { status: 404 });
        }

        // Get checkin interval from user's messages delivery_rules
        const { data: messageRule } = await supabase
            .from("messages")
            .select("delivery_rules!inner(checkin_interval_days)")
            .eq("owner_id", userId)
            .eq("delivery_rules.mode", "checkin")
            .limit(1)
            .maybeSingle();

        // Safe extraction since PostgREST can return an array or object for inner joins
        let intervalDays = 30;
        if (messageRule?.delivery_rules) {
            const rules = Array.isArray(messageRule.delivery_rules) 
                ? messageRule.delivery_rules[0] 
                : messageRule.delivery_rules;
            if (rules?.checkin_interval_days) {
                intervalDays = rules.checkin_interval_days;
            }
        }

        const nextDue = new Date();
        nextDue.setDate(now.getDate() + intervalDays);

        // Reset the checkin
        await supabase
            .from("checkins")
            .update({
                last_confirmed_at: now.toISOString(),
                next_due_at: nextDue.toISOString(),
                attempts: 0,
                status: "active",
            })
            .eq("user_id", userId);

        // Delete the used token and any stale reminder tokens for this user
        await supabase
            .from("verification_tokens")
            .delete()
            .eq("user_id", userId)
            .in("action", [
                "user-checkin-reminder-1",
                "user-checkin-reminder-2",
                "user-checkin-reminder-3",
            ]);

        // Log the event
        await supabase.from("events").insert({
            type: "checkin_confirmed",
            user_id: userId,
            metadata: {
                confirmed_at: now.toISOString(),
                next_due_at: nextDue.toISOString(),
                method: "email_token",
            },
        });

        return NextResponse.json({
            success: true,
            next_due_at: nextDue.toISOString(),
        });
    } catch (error) {
        console.error("Token checkin confirm error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}