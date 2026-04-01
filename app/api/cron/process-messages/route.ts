import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/cron-auth";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { isValidLocale, Locale } from '@/lib/i18n';
import { sendMessageDeliveryEmail } from '@/components/emails/message-delivery-email';

// Use service role for admin operations (bypass RLS)
function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export const dynamic = "force-dynamic";
export const runtime = 'nodejs';

/**
 * GET /api/cron/process-messages
 * Called by Vercel Cron to send scheduled messages
 */
export async function GET(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getAdminClient();
    const now = new Date().toISOString();
    
    // Recovery: Allow reclaiming stalled claims older than 15 minutes.
    const DELIVERY_CLAIM_TIMEOUT_MINUTES = 15;
    const staleThreshold = new Date(Date.now() - DELIVERY_CLAIM_TIMEOUT_MINUTES * 60 * 1000).toISOString();

    const results = {
        processed: 0,
        sent: 0,
        errors: [] as string[]
    };

    try {
        // 1. Find potentially eligible messages that aren't already claimed (or have stale claims)
        // status = 'scheduled'
        // delivery_rules.mode = 'date'
        // delivery_rules.deliver_at <= now
        // OR: delivery_claimed_at IS NULL OR older than 15m (recovery for orphaned claims)
        const { data: messages, error } = await supabase
            .from("messages")
            .select(`
                *,
                recipients (*),
                delivery_rules!inner (
                    mode,
                    deliver_at
                ),
                profiles:owner_id (
                  id,
                  first_name,
                  last_name,
                  locale
                )
            `)
            .eq("status", "scheduled")
            .or(`delivery_claimed_at.is.null,delivery_claimed_at.lt.${staleThreshold}`)
            .eq("delivery_rules.mode", "date")
            .lte("delivery_rules.deliver_at", now);

        if (error) {
            console.error("Error fetching messages:", error);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        if (!messages || messages.length === 0) {
            return NextResponse.json({ message: "No messages to process", results });
        }

        for (const message of messages) {
            results.processed++;

            // 2. ATOMIC CLAIM
            // Capture a unique claim timestamp for this specific message processing attempt.
            const claimStamp = new Date().toISOString();

            // We claim the message by setting delivery_claimed_at.
            // Enforce status='scheduled' and (unclaimed OR stale claim) for recovery/safety.
            const { data: claimed, error: claimError } = await supabase
                .from("messages")
                .update({ delivery_claimed_at: claimStamp })
                .eq("id", message.id)
                .eq("status", "scheduled")
                .or(`delivery_claimed_at.is.null,delivery_claimed_at.lt.${staleThreshold}`)
                .select("id");

            if (claimError || !claimed || claimed.length === 0) {
                // Skip: Another instance claimed it just as we were starting
                continue;
            }

            // [Telemetry] Log successful claim
            try {
                await supabase.from("events").insert({
                    type: "message_claimed",
                    user_id: message.owner_id,
                    metadata: {
                        message_id: message.id,
                        flow: "date",
                        claim_stamp: claimStamp,
                        reclaimed_stale: message.delivery_claimed_at !== null
                    }
                });
            } catch (telemetryErr) {
                console.error("Telemetry error (claim):", telemetryErr);
            }

            const profile = message.profiles as { id: string, first_name?: string, last_name?: string, locale?: string } | null;
            const senderName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Someone special';
            const senderFirstName = profile?.first_name || 'Someone';

            const recipient = message.recipients?.[0];
            if (!recipient || !recipient.email) {
                results.errors.push(`Message ${message.id}: No recipient`);
                
                // [Telemetry] Log claim release
                try {
                    await supabase.from("events").insert({
                        type: "message_claim_released",
                        user_id: message.owner_id,
                        metadata: { message_id: message.id, flow: "date", claim_stamp: claimStamp, reason: "no_recipient" }
                    });
                } catch (telemetryErr) {
                    console.error("Telemetry error (release):", telemetryErr);
                }

                // Release claim - ONLY if we still own it
                await supabase
                    .from("messages")
                    .update({ delivery_claimed_at: null })
                    .eq("id", message.id)
                    .eq("delivery_claimed_at", claimStamp);
                continue;
            }

            try {
                const localeRaw = profile?.locale || 'en';
                const locale = (isValidLocale(localeRaw) ? localeRaw : 'en') as Locale;

                // 3. GENERATE LINK AND SEND
                const { data: linkData } = await supabase.auth.admin.generateLink({
                    type: 'magiclink',
                    email: recipient.email,
                    options: {
                        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/dashboard/received`
                    }
                });

                if (!linkData?.properties?.action_link) {
                    throw new Error("Magic link generation failed");
                }

                const magicLink = linkData.properties.action_link;

                // Use React email component
                const { error: sendError } = await sendMessageDeliveryEmail(
                    recipient.email,
                    magicLink,
                    senderName,
                    senderFirstName,
                    locale
                );

                if (sendError) {
                    throw new Error(`Email send failed: ${String(sendError)}`);
                }

                // 4. MARK DELIVERED (SUCCESS)
                // Verify we still own the claim before committing the state change.
                const { data: finalized, error: finalizeError } = await supabase
                    .from("messages")
                    .update({ status: "delivered" })
                    .eq("id", message.id)
                    .eq("status", "scheduled")
                    .eq("delivery_claimed_at", claimStamp)
                    .select("id");

                if (finalizeError || !finalized || finalized.length === 0) {
                    // [Telemetry] Log finalize failure
                    try {
                        await supabase.from("events").insert({
                            type: "message_finalize_failed",
                            user_id: message.owner_id,
                            metadata: { message_id: message.id, flow: "date", claim_stamp: claimStamp, reason: "ownership_lost" }
                        });
                    } catch (telemetryErr) {
                        console.error("Telemetry error (finalize_failed):", telemetryErr);
                    }
                    throw new Error("Finalize failed: claim ownership lost or concurrent update");
                }

                // [Telemetry] Log successful finalization
                try {
                    await supabase.from("events").insert({
                        type: "message_delivery_finalized",
                        user_id: message.owner_id,
                        metadata: { message_id: message.id, flow: "date", claim_stamp: claimStamp }
                    });
                } catch (telemetryErr) {
                    console.error("Telemetry error (finalized):", telemetryErr);
                }

                results.sent++;

            } catch (err) {
                console.error(`Error processing message ${message.id}:`, err);
                const reason = String(err);
                results.errors.push(`Message ${message.id}: ${reason}`);

                // [Telemetry] Log send failure (if not already logged as finalize failure)
                if (!reason.includes("Finalize failed")) {
                    try {
                        await supabase.from("events").insert({
                            type: "message_send_failed",
                            user_id: message.owner_id,
                            metadata: { message_id: message.id, flow: "date", claim_stamp: claimStamp, reason }
                        });
                    } catch (telemetryErr) {
                        console.error("Telemetry error (send_failed):", telemetryErr);
                    }
                }

                // [Telemetry] Log claim release
                try {
                    await supabase.from("events").insert({
                        type: "message_claim_released",
                        user_id: message.owner_id,
                        metadata: { message_id: message.id, flow: "date", claim_stamp: claimStamp, reason: "failure_rollback" }
                    });
                } catch (telemetryErr) {
                    console.error("Telemetry error (release):", telemetryErr);
                }

                // 5. UNCLAIM ON FAILURE
                // ONLY release if we still own the claim and status is still scheduled.
                await supabase
                    .from("messages")
                    .update({ delivery_claimed_at: null })
                    .eq("id", message.id)
                    .eq("status", "scheduled")
                    .eq("delivery_claimed_at", claimStamp);
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (e) {
        console.error("Cron handler error:", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
