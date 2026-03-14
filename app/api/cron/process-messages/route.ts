import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getResend, DEFAULT_SENDER } from '@/lib/resend';
import { trackEmail } from '@/lib/email-tracking';
import { getDictionary, Locale } from '@/lib/i18n';
import { getMessageDeliveryTemplate, EmailDictionary } from '@/lib/email-templates';

// Use service role for admin operations (bypass RLS)
function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

/**
 * GET /api/cron/process-messages
 * Called by Vercel Cron to send scheduled messages
 */
export async function GET(request: NextRequest) {
    // Verify cron secret
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    const customHeader = request.headers.get("x-cron-secret");

    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction || cronSecret) {
        let authorized = false;
        if (authHeader === `Bearer ${cronSecret}`) authorized = true;
        if (customHeader === cronSecret) authorized = true;

        if (!authorized) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    const supabase = getAdminClient();
    const resend = getResend();
    const now = new Date().toISOString();

    const results = {
        processed: 0,
        sent: 0,
        errors: [] as string[]
    };

    try {
        // Find messages that are:
        // 1. Status = 'scheduled'
        // 2. Delivery Rule Mode = 'date'
        // 3. Deliver At <= Now
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

            const profile = message.profiles as { id: string, first_name?: string, last_name?: string, locale?: string } | null;
            const senderName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Someone special';
            const senderFirstName = profile?.first_name || 'Someone';

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
                const localeRaw = profile?.locale || 'en';
                const locale = (['en', 'es'].includes(localeRaw) ? localeRaw : 'en') as Locale;
                const dict = await getDictionary(locale);

                // Generate magic link for recipient
                const { data: linkData } = await supabase.auth.admin.generateLink({
                    type: 'magiclink',
                    email: recipient.email,
                    options: {
                        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/dashboard/received`
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
                await supabase
                    .from("messages")
                    .update({ status: "delivered" })
                    .eq("id", message.id);

                results.sent++;

            } catch (sendError) {
                console.error(`Error sending message ${message.id}:`, sendError);
                results.errors.push(`Message ${message.id}: ${String(sendError)}`);
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (e) {
        console.error("Cron handler error:", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
