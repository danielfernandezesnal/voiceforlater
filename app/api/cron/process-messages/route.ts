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

    const results = {
        processed: 0,
        sent: 0,
        errors: [] as string[]
    };

    try {
        // 1. Find potentially eligible messages that aren't already claimed
        // status = 'scheduled'
        // delivery_rules.mode = 'date'
        // delivery_rules.deliver_at <= now
        // delivery_claimed_at is NULL (important for idempotency)
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
            .is("delivery_claimed_at", null)
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
            // We claim the message by setting delivery_claimed_at.
            // Enforce status='scheduled' and delivery_claimed_at IS NULL for thread-safety.
            const { data: claimed, error: claimError } = await supabase
                .from("messages")
                .update({ delivery_claimed_at: now })
                .eq("id", message.id)
                .eq("status", "scheduled")
                .is("delivery_claimed_at", null)
                .select("id");

            if (claimError || !claimed || claimed.length === 0) {
                // Skip: Another instance claimed it just as we were starting
                continue;
            }

            const profile = message.profiles as { id: string, first_name?: string, last_name?: string, locale?: string } | null;
            const senderName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Someone special';
            const senderFirstName = profile?.first_name || 'Someone';

            const recipient = message.recipients?.[0];
            if (!recipient || !recipient.email) {
                results.errors.push(`Message ${message.id}: No recipient`);
                // Release claim even if it has no recipient (so it can be re-audited or cleaned up)
                await supabase.from("messages").update({ delivery_claimed_at: null }).eq("id", message.id);
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
                await supabase
                    .from("messages")
                    .update({ status: "delivered" })
                    .eq("id", message.id);

                results.sent++;

            } catch (err) {
                console.error(`Error processing message ${message.id}:`, err);
                results.errors.push(`Message ${message.id}: ${String(err)}`);

                // 5. UNCLAIM ON FAILURE (ONLY if still scheduled)
                // This ensures it stays eligible for retry in the next cycle.
                await supabase
                    .from("messages")
                    .update({ delivery_claimed_at: null })
                    .eq("id", message.id)
                    .eq("status", "scheduled");
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (e) {
        console.error("Cron handler error:", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
