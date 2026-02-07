import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/checkin/confirm
 * User confirms they are still active (resets their check-in timer)
 */
export async function POST() {
    try {
        const supabase = await createClient();

        // Verify user is authenticated
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the user's checkin record
        const { data: checkin, error: checkinError } = await supabase
            .from("checkins")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (checkinError || !checkin) {
            return NextResponse.json(
                { error: "No active check-in found" },
                { status: 404 }
            );
        }

        // Get the interval days from delivery_rules
        const { data: deliveryRule } = await supabase
            .from("delivery_rules")
            .select("checkin_interval_days, message_id")
            .eq("mode", "checkin")
            .limit(1)
            .single();

        const intervalDays = deliveryRule?.checkin_interval_days || 30;

        // Calculate next due date
        const now = new Date();
        const nextDue = new Date();
        nextDue.setDate(now.getDate() + intervalDays);

        // Update checkin record
        const { error: updateError } = await supabase
            .from("checkins")
            .update({
                last_confirmed_at: now.toISOString(),
                next_due_at: nextDue.toISOString(),
                attempts: 0,
                status: "active",
            })
            .eq("user_id", user.id);

        if (updateError) {
            console.error("Error updating checkin:", updateError);
            return NextResponse.json(
                { error: "Failed to confirm check-in" },
                { status: 500 }
            );
        }

        // Log the event
        await supabase.from("events").insert({
            type: "checkin_confirmed",
            user_id: user.id,
            metadata: {
                confirmed_at: now.toISOString(),
                next_due_at: nextDue.toISOString(),
            },
        });

        return NextResponse.json({
            success: true,
            next_due_at: nextDue.toISOString(),
            message: `Check-in confirmed. Next reminder in ${intervalDays} days.`,
        });
    } catch (error) {
        console.error("Check-in confirm error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/checkin/confirm
 * Get current check-in status for the user
 */
export async function GET() {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: checkin } = await supabase
            .from("checkins")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (!checkin) {
            return NextResponse.json({ hasCheckin: false });
        }

        const now = new Date();
        const nextDue = new Date(checkin.next_due_at);
        const isOverdue = now > nextDue;

        return NextResponse.json({
            hasCheckin: true,
            status: checkin.status,
            lastConfirmedAt: checkin.last_confirmed_at,
            nextDueAt: checkin.next_due_at,
            attempts: checkin.attempts,
            isOverdue,
            daysRemaining: isOverdue ? 0 : Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        });
    } catch (error) {
        console.error("Check-in status error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
