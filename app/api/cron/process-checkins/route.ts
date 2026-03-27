import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { DEFAULT_SENDER } from "@/lib/resend";
import { type Plan, getMaxReminders } from "@/lib/plans";
import crypto from 'crypto';
import { getDictionary, isValidLocale, Locale } from '@/lib/i18n';
import { getCheckinReminderTemplate, getTrustedContactNotifyTemplate, EmailDictionary } from '@/lib/email-templates';

// Timing constants (in days)
const REMINDER_SPACING_DAYS = 4;        // Day 0 → Day 4 → Day 8
const OUTREACH_SPACING_DAYS = 3;        // Day 12 → Day 15
const TOKEN_EXPIRY_HOURS = 72;          // Verification token valid for 3 days

function generateToken() {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, tokenHash };
}

function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

function getResendClient() {
    if (!process.env.RESEND_API_KEY) return null;
    return new Resend(process.env.RESEND_API_KEY);
}

/**
 * GET /api/cron/process-checkins
 * Called by Vercel Cron daily to process overdue check-ins.
 *
 * State machine:
 *   active → pending (missed check-in)
 *   pending: attempts < maxReminders → send reminder, next_due_at += 4 days
 *   pending: attempts >= maxReminders → awaiting_verification, notify contact 1, next_due_at += 3 days
 *   awaiting_verification → notify next uncontacted contact (or confirmed_absent if all done)
 *
 * Configure in vercel.json:
 * { "crons": [{ "path": "/api/cron/process-checkins", "schedule": "0 9 * * *" }] }
 */
export async function GET(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    const customHeader = request.headers.get("x-cron-secret");
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction || cronSecret) {
        const authorized =
            authHeader === `Bearer ${cronSecret}` ||
            customHeader === cronSecret;
        if (!authorized) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    const supabase = getAdminClient();
    const now = new Date();
    const results = {
        processed: 0,
        reminders_sent: 0,
        trusted_contact_notified: 0,
        messages_delivered: 0,
        errors: [] as string[],
    };

    try {
        // Fetch all overdue checkins that are not yet fully resolved
        const { data: overdueCheckins, error } = await supabase
            .from("checkins")
            .select(`*, profiles!inner(id)`)
            .lt("next_due_at", now.toISOString())
            .neq("status", "confirmed_absent");

        if (error) {
            console.error("Error fetching checkins:", error);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        if (!overdueCheckins || overdueCheckins.length === 0) {
            return NextResponse.json({ message: "No overdue checkins", results });
        }

        for (const checkin of overdueCheckins) {
            results.processed++;
            const userId = checkin.user_id;
            const attempts = checkin.attempts || 0;
            const currentStatus = checkin.status as string;

            try {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("plan, locale, first_name, last_name")
                    .eq("id", userId)
                    .single();

                const plan = (profile?.plan as Plan) || "free";
                const localeRaw = profile?.locale || 'en';
                const locale = (isValidLocale(localeRaw) ? localeRaw : 'en') as Locale;
                const dict = await getDictionary(locale);
                const maxReminders = getMaxReminders(plan);

                const { data: authUser } = await supabase.auth.admin.getUserById(userId);
                const userEmail = authUser?.user?.email;

                const senderName = [profile?.first_name, profile?.last_name]
                    .filter(Boolean).join(' ').trim()
                    || userEmail?.split('@')[0]
                    || '';

                // ── BRANCH A: Reminder phase ──────────────────────────────────
                if (currentStatus !== 'awaiting_verification' && attempts < maxReminders) {
                    const resendClient = getResendClient();
                    if (userEmail && resendClient) {
                        const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/confirmar-actividad`;
                        const { subject, html } = getCheckinReminderTemplate(
                            dict as unknown as EmailDictionary,
                            { attempts: attempts + 1, confirmUrl }
                        );
                        await resendClient.emails.send({
                            from: DEFAULT_SENDER,
                            to: userEmail,
                            subject,
                            html,
                        });
                        results.reminders_sent++;
                    }

                    const nextDue = new Date(now);
                    nextDue.setDate(nextDue.getDate() + REMINDER_SPACING_DAYS);

                    await supabase
                        .from("checkins")
                        .update({
                            attempts: attempts + 1,
                            next_due_at: nextDue.toISOString(),
                            status: "pending",
                        })
                        .eq("user_id", userId);

                    await supabase.from("events").insert({
                        type: "checkin_reminder_sent",
                        user_id: userId,
                        metadata: { attempt: attempts + 1 },
                    });

                    continue;
                }

                // ── BRANCH B: Trusted contact outreach phase ──────────────────
                // Reached when: attempts >= maxReminders (just finished last reminder)
                //           OR: currentStatus === 'awaiting_verification' (sequential outreach in progress)

                // Fetch trusted contacts in stable order for sequential outreach
                const { data: allContacts } = await supabase
                    .from("trusted_contacts")
                    .select("name, email")
                    .eq("user_id", userId)
                    .order("created_at", { ascending: true })
                    .order("id", { ascending: true });

                if (!allContacts || allContacts.length === 0) {
                    await supabase
                        .from("checkins")
                        .update({ status: "confirmed_absent" })
                        .eq("user_id", userId);
                    continue;
                }

                // Idempotency guard: find already-notified contacts
                const { data: existingTokens } = await supabase
                    .from("verification_tokens")
                    .select("contact_email")
                    .eq("user_id", userId)
                    .eq("action", "verify-status");

                const notifiedEmails = new Set(
                    (existingTokens || []).map(t => t.contact_email as string)
                );

                // Pick the next contact not yet notified
                const nextContact = allContacts.find(c => !notifiedEmails.has(c.email));

                if (!nextContact) {
                    // All contacts have been notified — outreach complete
                    await supabase
                        .from("checkins")
                        .update({ status: "confirmed_absent" })
                        .eq("user_id", userId);
                    continue;
                }

                // Send to next contact
                const resendClient = getResendClient();
                if (resendClient) {
                    const { rawToken, tokenHash } = generateToken();
                    const expiresAt = new Date(now);
                    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

                    const { error: tokenError } = await supabase
                        .from("verification_tokens")
                        .insert({
                            user_id: userId,
                            contact_email: nextContact.email,
                            token_hash: tokenHash,
                            expires_at: expiresAt.toISOString(),
                            action: "verify-status",
                        });

                    if (tokenError) {
                        results.errors.push(`Token error for ${nextContact.email}: ${tokenError.message}`);
                    } else {
                        const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/verify-status?token=${rawToken}`;
                        const { subject, html } = getTrustedContactNotifyTemplate(
                            dict as unknown as EmailDictionary,
                            { senderName, verifyUrl }
                        );

                        await resendClient.emails.send({
                            from: DEFAULT_SENDER,
                            to: nextContact.email,
                            subject,
                            html,
                        });
                        results.trusted_contact_notified++;

                        await supabase.from("events").insert({
                            type: "trusted_contact_notified",
                            user_id: userId,
                            metadata: { contact_email: nextContact.email },
                        });
                    }
                }

                // Determine next state: are there more contacts to notify?
                const remainingContacts = allContacts.filter(
                    c => !notifiedEmails.has(c.email) && c.email !== nextContact.email
                );

                if (remainingContacts.length === 0) {
                    // Last contact was just notified — outreach complete
                    await supabase
                        .from("checkins")
                        .update({ status: "confirmed_absent" })
                        .eq("user_id", userId);
                } else {
                    // More contacts remain — stay in awaiting_verification, schedule next outreach
                    const nextOutreach = new Date(now);
                    nextOutreach.setDate(nextOutreach.getDate() + OUTREACH_SPACING_DAYS);

                    await supabase
                        .from("checkins")
                        .update({
                            status: "awaiting_verification",
                            next_due_at: nextOutreach.toISOString(),
                        })
                        .eq("user_id", userId);
                }

            } catch (userError) {
                console.error(`Error processing user ${userId}:`, userError);
                results.errors.push(`User ${userId}: ${String(userError)}`);
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error) {
        console.error("Cron error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
