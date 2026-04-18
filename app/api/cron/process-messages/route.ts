import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/cron-auth";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { isValidLocale, Locale, defaultLocale } from '@/lib/i18n';
import { sendMessageDeliveryEmail } from '@/components/emails/message-delivery-email';
import { logDeliveryEvent } from "@/lib/delivery-telemetry";
import crypto from 'crypto';

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
        skipped: 0,
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
            // Split into two separate UPDATEs — PostgREST's .or() with is.null is unreliable
            // on PATCH requests, causing the claim to silently return 0 rows even when the row
            // is unclaimed. Using .is() and .lt() separately generates correct predicates.

            // Attempt 1: claim a fresh (never-claimed) message
            const { data: claimedFresh, error: claimFreshError } = await supabase
                .from("messages")
                .update({ delivery_claimed_at: claimStamp })
                .eq("id", message.id)
                .eq("status", "scheduled")
                .is("delivery_claimed_at", null)
                .select("id");

            // Attempt 2: reclaim a stale claim (orphaned by a prior crashed instance)
            let claimed = claimedFresh;
            let claimError = claimFreshError;
            if (!claimFreshError && (!claimedFresh || claimedFresh.length === 0)) {
                const { data: claimedStale, error: claimStaleError } = await supabase
                    .from("messages")
                    .update({ delivery_claimed_at: claimStamp })
                    .eq("id", message.id)
                    .eq("status", "scheduled")
                    .lt("delivery_claimed_at", staleThreshold)
                    .select("id");
                claimed = claimedStale;
                claimError = claimStaleError;
            }

            if (claimError || !claimed || claimed.length === 0) {
                // Skip: Another instance claimed it just as we were starting (race condition guard)
                console.log(`[cron] Claim failed for message ${message.id} — skipped (claimError: ${claimError?.message ?? 'none'}, rows: ${claimed?.length ?? 'null'})`);
                results.skipped++;
                continue;
            }

            // [Telemetry] Log successful claim
            void logDeliveryEvent(supabase, {
                type: "message_claimed",
                userId: message.owner_id,
                metadata: {
                    message_id: message.id,
                    flow: "date",
                    claim_stamp: claimStamp,
                    reclaimed_stale: message.delivery_claimed_at !== null
                }
            });

            const profile = message.profiles as { id: string, first_name?: string, last_name?: string, locale?: string } | null;
            const senderName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Someone special';
            const senderFirstName = profile?.first_name || 'Someone';

            const recipient = message.recipients?.[0];
            if (!recipient || !recipient.email) {
                results.errors.push(`Message ${message.id}: No recipient`);
                
                // [Telemetry] Log claim release
                void logDeliveryEvent(supabase, {
                    type: "message_claim_released",
                    userId: message.owner_id,
                    metadata: { message_id: message.id, flow: "date", claim_stamp: claimStamp, reason: "no_recipient" }
                });

                // Release claim - ONLY if we still own it
                await supabase
                    .from("messages")
                    .update({ delivery_claimed_at: null })
                    .eq("id", message.id)
                    .eq("delivery_claimed_at", claimStamp);
                continue;
            }

            try {
                const localeRaw = profile?.locale || defaultLocale;
                const locale = (isValidLocale(localeRaw) ? localeRaw : defaultLocale) as Locale;

                // 3. GENERATE DELIVERY TOKEN AND SEND
                const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
                
                const tokenString = crypto.randomBytes(32).toString('hex');
                // Create a 15-day, multi-use delivery token (replaces Supabase magic link
                // which expires in 1 hour and is single-use).
                const { data: deliveryToken, error: tokenError } = await supabase
                    .from('delivery_tokens')
                    .insert({
                        message_id: message.id,
                        recipient_id: recipient.id,
                        token: tokenString,
                        expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
                    })
                    .select('token')
                    .single();

                if (tokenError || !deliveryToken) {
                    throw new Error(`Delivery token generation failed: ${tokenError?.message ?? 'no token returned'}`);
                }

                // Link points to welcome page; after login/register the recipient is
                // redirected straight to the message.
                const magicLink = `${appUrl}/${locale}/recibir/${deliveryToken.token}`;

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
                    void logDeliveryEvent(supabase, {
                        type: "message_finalize_failed",
                        userId: message.owner_id,
                        metadata: { message_id: message.id, flow: "date", claim_stamp: claimStamp, reason: "ownership_lost" }
                    });
                    throw new Error("Finalize failed: claim ownership lost or concurrent update");
                }

                // [Telemetry] Log successful finalization
                void logDeliveryEvent(supabase, {
                    type: "message_delivery_finalized",
                    userId: message.owner_id,
                    metadata: { message_id: message.id, flow: "date", claim_stamp: claimStamp }
                });

                results.sent++;

            } catch (err) {
                const reason = String(err);
                console.error(`Error processing message ${message.id}:`, reason);
                results.errors.push(`Message ${message.id}: ${reason}`);

                // [Telemetry] Log send failure (if not already logged as finalize failure)
                if (!reason.includes("Finalize failed")) {
                    void logDeliveryEvent(supabase, {
                        type: "message_send_failed",
                        userId: message.owner_id,
                        metadata: { message_id: message.id, flow: "date", claim_stamp: claimStamp, reason }
                    });
                }

                // [Telemetry] Log claim release
                void logDeliveryEvent(supabase, {
                    type: "message_claim_released",
                    userId: message.owner_id,
                    metadata: { message_id: message.id, flow: "date", claim_stamp: claimStamp, reason: "failure_rollback" }
                });

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

