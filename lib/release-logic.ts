
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getDictionary, Locale } from '@/lib/i18n';
import { getMessageDeliveryTemplate, EmailDictionary } from "@/lib/email-templates";

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

    try {
        // 2. Fetch messages to release
        // We cannot use 'processing' status as it violates the check constraint (draft, scheduled, delivered).
        // Since this function is called inside an atomic token claim (idempotent), we can process directly.
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
            .eq("delivery_rules.mode", "checkin");

        if (error) {
            console.error("Error fetching messages for release:", error);
            throw new Error(`Database error: ${error.message}`);
        }

        if (!messages || messages.length === 0) {
            return { ...results, message: "No messages to release" };
        }

        // 3. Process each message 
        // We use Optimistic Concurrency Control by re-checking status inside the loop.
        for (const message of messages) {
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

            const senderName = `${message.profiles?.first_name || ''} ${message.profiles?.last_name || ''}`.trim() || 'Someone special';
            const senderFirstName = message.profiles?.first_name || 'Someone';

            const recipient = message.recipients?.[0];
            if (!recipient || !recipient.email) {
                results.errors.push(`Message ${message.id}: No recipient`);
                continue;
            }

            if (!resend) {
                results.errors.push(`Resend client not initialized`);
                break;
            }

            try {
                const localeRaw = locale || 'en';
                const validLocale = (['en', 'es'].includes(localeRaw) ? localeRaw : 'en') as Locale;
                const dict = await getDictionary(validLocale);

                // Generate magic link for recipient
                const { data: linkData } = await supabase.auth.admin.generateLink({
                    type: 'magiclink',
                    email: recipient.email,
                    options: {
                        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/${validLocale}/dashboard/received`
                    }
                });
                
                if (!linkData?.properties?.action_link) {
                    console.error(`Failed to generate magic link for ${recipient.email}`);
                    results.errors.push(`Message ${message.id}: Magic link generation failed`);
                    continue;
                }

                const magicLink = linkData.properties.action_link;

                // Use template
                const template = getMessageDeliveryTemplate(dict as unknown as EmailDictionary, { contentHtml: "", magicLink, senderName });

                await resend.emails.send({
                    from: `${senderFirstName} via Carry My Words <no-reply@voiceforlater.com>`,
                    to: recipient.email,
                    subject: template.subject,
                    html: template.html
                });

                // Update status to delivered
                const { error: updateError } = await supabase
                    .from("messages")
                    .update({ status: "delivered" })
                    .eq("id", message.id)
                    .eq("status", "scheduled");

                if (updateError) {
                    results.errors.push(`Message ${message.id}: Failed to update status after sending.`);
                } else {
                    results.sent++;
                }

            } catch (sendError) {
                console.error(`Error sending message ${message.id}:`, sendError);
                results.errors.push(`Message ${message.id}: ${String(sendError)}`);
            }
        }

        return results;

    } catch (e) {
        console.error("Release logic error:", e);
        throw e;
    }
}
