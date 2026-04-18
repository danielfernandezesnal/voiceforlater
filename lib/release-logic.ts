
import { createClient } from "@supabase/supabase-js";
import { isValidLocale, Locale, defaultLocale } from '@/lib/i18n';
import { sendMessageDeliveryEmail } from '@/components/emails/message-delivery-email';
import { logDeliveryEvent } from "@/lib/delivery-telemetry";

// Helper to get admin client
function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

/**
 * Releases all eligible check-in messages for a given user.
 * 
 * @param userId - The ID of the user whose messages should be released
 * @returns object with results (processed, sent, errors)
 */
export async function releaseCheckinMessages(userId: string) {
    const supabase = getAdminClient();

    // 1. Get user locale
    const { data: profile } = await supabase
        .from("profiles")
        .select("locale")
        .eq("id", userId)
        .single();

    const locale = profile?.locale || defaultLocale;

    const results = {
        processed: 0,
        sent: 0,
        errors: [] as string[]
    };

    // Stale claim expiration for self-recovery (15 minutes)
    const DELIVERY_CLAIM_TIMEOUT_MINUTES = 15;
    const staleThreshold = new Date(Date.now() - DELIVERY_CLAIM_TIMEOUT_MINUTES * 60 * 1000).toISOString();

    try {
        // 2. Fetch messages to release
        // We fetch messages that are scheduled and unclaimed (OR stale orphaned claims).
        const { data: messages, error } = await supabase
            .from("messages")
            .select(`
                *,
                recipients (*),
                profiles (
                   first_name,
                   last_name
                ),
                delivery_rules!inner (
                    mode
                )
            `)
            .eq("owner_id", userId)
            .eq("status", "scheduled")
            .or(`delivery_claimed_at.is.null,delivery_claimed_at.lt.${staleThreshold}`)
            .eq("delivery_rules.mode", "checkin");

        if (error) {
            console.error("Error fetching messages for release:", error);
            throw new Error(`Database error: ${error.message}`);
        }

        if (!messages || messages.length === 0) {
            return { ...results, message: "No messages to release" };
        }

        // 3. Process each message 
        for (const message of messages) {
            // Atomic Claim — 2-step pattern (matches process-messages)
            // PostgREST's .or() with is.null is unreliable on PATCH requests,
            // so we split into: (1) fresh claim, (2) stale reclaim.
            const claimStamp = new Date().toISOString();

            // Step 1: claim a fresh (never-claimed) message
            const { data: claimedFresh, error: claimFreshError } = await supabase
                .from("messages")
                .update({ delivery_claimed_at: claimStamp })
                .eq("id", message.id)
                .eq("status", "scheduled")
                .is("delivery_claimed_at", null)
                .select("id");

            // Step 2: reclaim a stale claim (orphaned by a prior crashed instance)
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
                // Skip if another process already claimed it
                continue;
            }

            // [Telemetry] Log successful claim
            void logDeliveryEvent(supabase, {
                type: "message_claimed",
                userId: message.owner_id,
                metadata: {
                    message_id: message.id,
                    flow: "checkin",
                    claim_stamp: claimStamp,
                    reclaimed_stale: message.delivery_claimed_at !== null
                }
            });

            results.processed++;

            const senderName = `${message.profiles?.first_name || ''} ${message.profiles?.last_name || ''}`.trim() || 'Someone special';
            const senderFirstName = message.profiles?.first_name || 'Someone';

            const recipient = message.recipients?.[0];
            if (!recipient || !recipient.email) {
                results.errors.push(`Message ${message.id}: No recipient`);

                // [Telemetry] Log claim release
                void logDeliveryEvent(supabase, {
                    type: "message_claim_released",
                    userId: message.owner_id,
                    metadata: { message_id: message.id, flow: "checkin", claim_stamp: claimStamp, reason: "no_recipient" }
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
                const localeRaw = locale || defaultLocale;
                const validLocale = (isValidLocale(localeRaw) ? localeRaw : defaultLocale) as Locale;

                // Generate 15-day, multi-use delivery token (aligned with date delivery)
                const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
                const { data: deliveryToken, error: tokenError } = await supabase
                    .from('delivery_tokens')
                    .insert({
                        message_id: message.id,
                        recipient_email: recipient.email,
                        expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
                    })
                    .select('token')
                    .single();

                if (tokenError || !deliveryToken) {
                    throw new Error(`Delivery token generation failed: ${tokenError?.message ?? 'no token returned'}`);
                }

                const magicLink = `${appUrl}/${validLocale}/recibir/${deliveryToken.token}`;

                // Use React email component
                const { error: sendError } = await sendMessageDeliveryEmail(
                    recipient.email,
                    magicLink,
                    senderName,
                    senderFirstName,
                    validLocale
                );

                if (sendError) {
                    throw new Error(`Email send failed: ${String(sendError)}`);
                }

                // Update status to delivered
                // BUT ONLY where we still own the claim.
                const { data: finalized, error: updateError } = await supabase
                    .from("messages")
                    .update({ status: "delivered" })
                    .eq("id", message.id)
                    .eq("status", "scheduled")
                    .eq("delivery_claimed_at", claimStamp)
                    .select("id");

                if (updateError || !finalized || finalized.length === 0) {
                    // [Telemetry] Log finalize failure
                    void logDeliveryEvent(supabase, {
                        type: "message_finalize_failed",
                        userId: message.owner_id,
                        metadata: {
                            message_id: message.id,
                            flow: "checkin",
                            claim_stamp: claimStamp,
                            reason: updateError ? updateError.message : "ownership_lost"
                        }
                    });
                    results.errors.push(`Message ${message.id}: Failed to finalize delivery state after sending (claim ownership lost or record changed).`);
                } else {
                    // [Telemetry] Log successful finalization
                    void logDeliveryEvent(supabase, {
                        type: "message_delivery_finalized",
                        userId: message.owner_id,
                        metadata: { message_id: message.id, flow: "checkin", claim_stamp: claimStamp }
                    });
                    results.sent++;
                }

            } catch (sendError) {
                const reason = String(sendError);
                console.error(`Error sending message ${message.id}:`, reason);
                results.errors.push(`Message ${message.id}: ${reason}`);

                // [Telemetry] Log send failure
                void logDeliveryEvent(supabase, {
                    type: "message_send_failed",
                    userId: message.owner_id,
                    metadata: { message_id: message.id, flow: "checkin", claim_stamp: claimStamp, reason }
                });

                // [Telemetry] Log claim release
                void logDeliveryEvent(supabase, {
                    type: "message_claim_released",
                    userId: message.owner_id,
                    metadata: { message_id: message.id, flow: "checkin", claim_stamp: claimStamp, reason: "failure_rollback" }
                });


                // Release claim on failure - ONLY if we still own it
                await supabase
                    .from("messages")
                    .update({ delivery_claimed_at: null })
                    .eq("id", message.id)
                    .eq("status", "scheduled")
                    .eq("delivery_claimed_at", claimStamp);
            }
        }

        return results;

    } catch (e) {
        console.error("Release logic error:", e);
        throw e;
    }
}

