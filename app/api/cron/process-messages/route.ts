import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getEmailTemplate } from "@/lib/email-templates";

// Use service role for admin operations (bypass RLS)
function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

function getResendClient() {
    if (!process.env.RESEND_API_KEY) {
        return null;
    }
    return new Resend(process.env.RESEND_API_KEY);
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
    const resend = getResendClient();
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

            // Get owner email for "From" name or context
            // (Optional, but nice to have 'You have a message from X')
            // For now, we'll use a generic sender to avoid complexity

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
                const locale = (message.profiles as any)?.locale || 'es';
                let contentHtml = "";

                if (message.type === 'text' && message.text_content) {
                    contentHtml += `
                        <div style="padding: 20px; background-color: #f3f4f6; border-radius: 8px; margin: 20px 0;">
                            <p style="white-space: pre-wrap; font-family: sans-serif;">${message.text_content}</p>
                        </div>
                    `;
                } else if (message.type === 'audio' || message.type === 'video') {
                    if (message.audio_path) {
                        const { data: signedUrl } = await supabase
                            .storage
                            .from('audio')
                            .createSignedUrl(message.audio_path, 60 * 60 * 24 * 7); // 7 days

                        if (signedUrl?.signedUrl) {
                            const label = locale === 'es'
                                ? (message.type === 'video' ? 'Ver Video' : 'Escuchar Audio')
                                : (message.type === 'video' ? 'View Video' : 'Listen to Audio');

                            contentHtml += `
                                <div style="margin: 20px 0;">
                                    <a href="${signedUrl.signedUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px;">
                                        ${label}
                                    </a>
                                </div>
                                <p style="font-size: 12px; color: #666;">
                                    ${locale === 'es' ? 'Link válido por 7 días.' : 'Link valid for 7 days.'}
                                </p>
                            `;
                        } else {
                            contentHtml += `<p>${locale === 'es' ? 'Error generando link.' : 'Error generating link.'}</p>`;
                        }
                    }
                }

                // Use template
                const template = getEmailTemplate('message_delivery', locale) as any;

                await resend.emails.send({
                    from: "VoiceForLater <noreply@voiceforlater.com>",
                    to: recipient.email,
                    subject: template.subject,
                    html: template.html({ contentHtml })
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
