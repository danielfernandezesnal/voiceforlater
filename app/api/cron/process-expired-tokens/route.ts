
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { releaseCheckinMessages } from "@/lib/release-logic";

export const runtime = 'nodejs';

/**
 * GET /api/cron/process-expired-tokens
 * 
 * Called periodically to check for expired verification tokens.
 * If a token is expired and wasn't used, we effectively treat it as 
 * "Trusted Contact did not respond in time" => Assuming Dead Man's Switch Trigger.
 * 
 * NOTE: The prompt says "AUTOMATIC RELEASE on token expiry".
 * This implies a policy where silence = consent/trigger.
 */

// Use service role for admin operations
function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function GET(request: NextRequest) {
    // Verify cron secret
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("x-cron-secret");

    // In production, Require the secret. 
    // In dev, allow if secret is not set (for manual testing), but if set, require it.
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction || cronSecret) {
        if (authHeader !== cronSecret) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    const supabase = getAdminClient();
    const now = new Date().toISOString();

    const results: {
        processed: number;
        released: number;
        errors: string[];
    } = {
        processed: 0,
        released: 0,
        errors: []
    };

    try {
        // 1. Atomic Claim of Expired Tokens
        // Find tokens that:
        // - are expired (expires_at < now)
        // - are NOT used (used_at is null)
        // - were for "verify-status" action
        // Update them to used_at = now, decision = 'expired'
        // Returning * ensures we process each token EXACTLY once.
        const { data: expiredTokens, error } = await supabase
            .from("verification_tokens")
            .update({
                used_at: now,
                used_reason: "expired_auto",
                used_ip: "system_cron",
                used_user_agent: "process-expired-tokens"
            })
            .lt("expires_at", now)
            .is("used_at", null)
            .eq("action", "verify-status")
            .select();

        if (error) {
            console.error("Error claiming expired tokens:", error);
            return NextResponse.json({ error: "Database error: " + error.message }, { status: 500 });
        }

        if (!expiredTokens || expiredTokens.length === 0) {
            return NextResponse.json({ success: true, message: "No expired tokens found", results });
        }

        // 2. Process Claimed Tokens
        for (const token of expiredTokens) {
            results.processed++;

            try {
                // A. Log 'expired' event
                // Decision is NULL because no one made a decision; it's a system event.
                await supabase.from("confirmation_events").insert({
                    user_id: token.user_id,
                    contact_email: token.contact_email,
                    token_id: token.id,
                    type: "token_expired",
                    decision: null
                }); // Implicitly safe ON CONFLICT if index exists, but default insert throws on conflict.
                // We rely on used_at claim for concurrency.

                // B. Release Messages
                const releaseResult = await releaseCheckinMessages(token.user_id);

                if (releaseResult.sent > 0 || releaseResult.processed > 0) {
                    results.released++;

                    // C. Log 'released' event
                    // Distinct type for the release action itself
                    await supabase.from("confirmation_events").insert({
                        user_id: token.user_id,
                        contact_email: token.contact_email,
                        token_id: token.id,
                        type: "messages_released_auto",
                        decision: null
                    });
                }

                if (releaseResult.errors.length > 0) {
                    results.errors.push(...releaseResult.errors);
                }

            } catch (err) {
                console.error(`Error processing expired token ${token.id}:`, err);
                results.errors.push(`Token ${token.id}: ${String(err)}`);
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (e) {
        console.error("Cron error:", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
