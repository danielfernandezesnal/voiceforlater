
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Helper to get admin client
function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// Helper to get Resend client
function getResendClient() {
    if (!process.env.RESEND_API_KEY) {
        return null;
    }
    return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Releases all eligible check-in messages for a given user.
 * 
 * @param userId - The ID of the user whose messages should be released
 * @returns object with results (processed, sent, errors)
 */
export async function releaseCheckinMessages(userId: string) {
    const supabase = getAdminClient();
    const resend = getResendClient();

    const results = {
        processed: 0,
        sent: 0,
        errors: [] as string[]
    };

    try {
        // 2. Fetch messages to release
        // We cannot use 'processing' status as it violates the check constraint (draft, scheduled, delivered).
        // Since this function is called inside an atomic token claim (idempotent), we can process directly.
        const { data: messages, error } = await supabase
            .from("messages")
            .select(`
                *,
                recipients (*),
                delivery_rules!inner (
                    mode
                )
            `)
            .eq("owner_id", userId)
            .eq("status", "scheduled")
            .eq("delivery_rules.mode", "checkin");

        if (error) {
            console.error("Error fetching messages for release:", error);
            throw new Error(`Database error: ${error.message}`);
        }

        if (!messages || messages.length === 0) {
            return { ...results, message: "No messages to release" };
        }

        // 3. Process each message (already marked processing)
        // No need to map ID or update status again here


        // 3. Process each message 
        // We use Optimistic Concurrency Control by re-checking status inside the loop.
        for (const message of messages) {

            // FASTEST SAFE PATH: 
            // Double-check status 'scheduled' immediately before sending (Optimistic Concurrency Control).
            const { data: currentMsg, error: staleCheck } = await supabase
                .from("messages")
                .select("status")
                .eq("id", message.id)
                .single();

            if (staleCheck || currentMsg.status !== 'scheduled') {
                continue; // Skip if already processed
            }

            results.processed++;

            const recipient = message.recipients?.[0];
            if (!recipient || !recipient.email) {
                results.errors.push(`Message ${message.id}: No recipient`);
                // Mark failed?
                await supabase.from("messages").update({ status: "draft" }).eq("id", message.id); // Revert to draft? Or failed status isn't allowed? 
                // DB constraint: draft, scheduled, delivered. 'failed' is NOT allowed.
                // We leave it as 'scheduled' (retry later) or move to 'draft' (needs intervention).
                // Let's leave as scheduled for retry, or draft to stop loop.
                continue;
            }

            if (!resend) {
                results.errors.push(`Resend client not initialized`);
                break;
            }

            try {
                // ... (Email generation logic same as before) ...
                let emailHtml = `
                    <h2>You have a message from VoiceForLater</h2>
                    <p>A message scheduled for you has been released.</p>
                `;

                if (message.type === 'text' && message.text_content) {
                    emailHtml += `
                        <div style="padding: 20px; background-color: #f3f4f6; border-radius: 8px; margin: 20px 0;">
                            <p style="white-space: pre-wrap;">${message.text_content}</p>
                        </div>
                    `;
                } else if (message.type === 'audio' || message.type === 'video') {
                    if (message.audio_path) {
                        const { data: signedUrl } = await supabase
                            .storage
                            .from('audio')
                            .createSignedUrl(message.audio_path, 60 * 60 * 24 * 7); // 7 days

                        if (signedUrl?.signedUrl) {
                            emailHtml += `
                                <div style="margin: 20px 0;">
                                    <a href="${signedUrl.signedUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px;">
                                        View ${message.type === 'video' ? 'Video' : 'Audio'} Message
                                    </a>
                                </div>
                                <p style="font-size: 12px; color: #666;">This link is valid for 7 days.</p>
                            `;
                        } else {
                            emailHtml += `<p>Error generating media link.</p>`;
                        }
                    }
                }

                emailHtml += `
                    <p style="margin-top: 30px; font-size: 12px; color: #888;">
                        VoiceForLater - Messages for when it matters.
                    </p>
                `;

                await resend.emails.send({
                    from: "VoiceForLater <noreply@voiceforlater.com>",
                    to: recipient.email,
                    subject: "You have a message via VoiceForLater",
                    html: emailHtml
                });

                // Update status to delivered
                // We use another check here to ensure we don't overwrite if it changed (though unlikely with single thread logic)
                const { error: updateError } = await supabase
                    .from("messages")
                    .update({ status: "delivered" })
                    .eq("id", message.id)
                    .eq("status", "scheduled"); // Optimistic lock

                if (updateError) {
                    results.errors.push(`Message ${message.id}: Failed to update status after sending.`);
                } else {
                    results.sent++;
                }

            } catch (sendError) {
                console.error(`Error sending message ${message.id}:`, sendError);
                results.errors.push(`Message ${message.id}: ${String(sendError)}`);
                // Leave as scheduled to retry
            }
        }

        return results;

    } catch (e) {
        console.error("Release logic error:", e);
        throw e;
    }
}
