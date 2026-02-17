
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from 'crypto';
import { releaseCheckinMessages } from "@/lib/release-logic";

export const runtime = "nodejs";

// Use service role for admin operations (bypass RLS)
function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(request: NextRequest) {
    try {
        const { token, decision } = await request.json();

        if (!token || !decision || !['confirm', 'deny'].includes(decision)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const supabase = getAdminClient();

        // 1. Hash the token
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // 2. Find and Validate Token
        const { data: verification, error: fetchError } = await supabase
            .from("verification_tokens")
            .select("*")
            .eq("token_hash", tokenHash)
            .single();

        if (fetchError || !verification) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
        }

        if (verification.used_at) {
            return NextResponse.json({ error: "Token already used" }, { status: 409 });
        }

        if (new Date(verification.expires_at) < new Date()) {
            return NextResponse.json({ error: "Token expired" }, { status: 410 });
        }

        // 3. Mark Token as Used (Idempotency Lock)
        const now = new Date().toISOString();
        const { data, error: updateError } = await supabase
            .from("verification_tokens")
            .update({
                used_at: now,
                used_reason: "user_action",
                used_ip: request.headers.get("x-forwarded-for") || "unknown",
                used_user_agent: request.headers.get("user-agent") || "unknown"
            })
            .eq("id", verification.id)
            .is("used_at", null) // Optimistic lock
            .select(); // Ask for returned data to check if row was updated

        if (updateError) {
            // If update fails, likely purely concurrent race condition
            return NextResponse.json({ error: "Concurrent usage detected" }, { status: 409 });
        }

        // Critical: If count is 0, it means it was already used by another request
        if (!data || data.length === 0) {
            return NextResponse.json({ error: "Token already used (Concurrent)" }, { status: 409 });
        }

        // Double check if update actually happened (row count > 0)
        // update returns status 204 typically.
        // If we want to be super strict, we can check select again, but .is() filter generally works.

        // 4. Log Event
        // Canonical type normalization (decision_confirm / decision_deny)
        const eventType = `decision_${decision}`;

        await supabase.from("confirmation_events").insert({
            user_id: verification.user_id,
            contact_email: verification.contact_email,
            decision: decision, // Keep strictly for query convenience if needed, though type covers it
            token_id: verification.id,
            type: eventType,
            ip_address: request.headers.get("x-forwarded-for") || "unknown",
            user_agent: request.headers.get("user-agent") || "unknown"
        });

        // 5. Execute Decision Logic
        if (decision === 'confirm') {
            // RELEASE MESSAGES
            const releaseResult = await releaseCheckinMessages(verification.user_id);

            // Also update a global user status if needed? 
            // The user is already 'confirmed_absent' or similar.
            // Maybe we want to mark them as 'released'?
            // leaving status as is for MVP, releaseCheckinMessages does the job.

            return NextResponse.json({ success: true, action: 'released', details: releaseResult });

        } else if (decision === 'deny') {
            // FALSE ALARM - Reset Check-in
            // Set status back to active, attempts 0, give them 24h grace period
            const nextDue = new Date();
            nextDue.setHours(nextDue.getHours() + 48); // 48h breather

            await supabase
                .from("checkins")
                .update({
                    status: 'active',
                    attempts: 0,
                    next_due_at: nextDue.toISOString(),
                    last_confirmed_at: now // technically they didn't confirm, but the contact did
                })
                .eq("user_id", verification.user_id);

            // Notify User about False Alarm? 
            // (Optional for MVP, but good practice)

            return NextResponse.json({ success: true, action: 'reset' });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Verify status error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
