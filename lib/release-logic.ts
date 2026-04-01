
import { createClient } from "@supabase/supabase-js";
import { isValidLocale, Locale } from '@/lib/i18n';
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

    const locale = profile?.locale || 'en';

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
            // Atomic Claim (Atomic reclaim of stale claims allowed)
            const claimStamp = new Date().toISOString();
            const { data: claimed, error: claimError } = await supabase
                .from("messages")
                .update({ delivery_claimed_at: claimStamp })
                .eq("id", message.id)
                .eq("status", "scheduled")
                .or(`delivery_claimed_at.is.null,delivery_claimed_at.lt.${staleThreshold}`)
                .select("id");

            if (claimError || !claimed || claimed.length === 0) {
                // Skip if another process already claimed it
                continue;
            }

            // [Telemetry] Log successful claim
            await logDeliveryEvent(supabase, {
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
                await logDeliveryEvent(supabase, {
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
                const localeRaw = locale || 'en';
                const validLocale = (isValidLocale(localeRaw) ? localeRaw : 'en') as Locale;

                // Generate magic link for recipient
                const { data: linkData } = await supabase.auth.admin.generateLink({
                    type: 'magiclink',
                    email: recipient.email,
                    options: {
                        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/${validLocale}/dashboard/received`
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
                    await logDeliveryEvent(supabase, {
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
                    await logDeliveryEvent(supabase, {
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
                await logDeliveryEvent(supabase, {
                    type: "message_send_failed",
                    userId: message.owner_id,
                    metadata: { message_id: message.id, flow: "checkin", claim_stamp: claimStamp, reason }
                });

                // [Telemetry] Log claim release
                await logDeliveryEvent(supabase, {
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

