import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/cron-auth";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { DEFAULT_SENDER } from "@/lib/resend";
import { type Plan, getMaxReminders } from "@/lib/plans";
import crypto from 'crypto';
import { getDictionary, isValidLocale, Locale, defaultLocale } from '@/lib/i18n';
import { sendCheckinReminder1Email } from '@/components/emails/checkin-reminder-1-email';
import { sendCheckinReminder2Email } from '@/components/emails/checkin-reminder-2-email';
import { sendCheckinReminder3Email } from '@/components/emails/checkin-reminder-3-email';
import { sendTrustedContactNotificationEmail } from '@/components/emails/trusted-contact-notification-email';

// Timing constants (in days)
const REMINDER_SPACING_DAYS = 4;        // Day 0 → Day 4 → Day 8
const OUTREACH_SPACING_DAYS = 3;        // Day 12 → Day 15
const TOKEN_EXPIRY_HOURS = 72;          // Verification token valid for 3 days

export const dynamic = "force-dynamic";
export const runtime = 'nodejs';

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
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
                const localeRaw = profile?.locale || defaultLocale;
                const locale = (isValidLocale(localeRaw) ? localeRaw : defaultLocale) as Locale;
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
                    let emailSent = false;

                    if (userEmail && resendClient) {
                        if (attempts === 1) { // Reminder 2 (Day 4)
                            const { data: existingTokens } = await supabase
                                .from("verification_tokens")
                                .select("token_hash")
                                .eq("user_id", userId)
                                .eq("contact_email", userEmail)
                                .eq("action", "user-checkin-reminder-2");

                            if (!existingTokens || existingTokens.length === 0) {
                                const { rawToken, tokenHash } = generateToken();
                                const expiresAt = new Date(now);
                                expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

                                const { error: tokenError } = await supabase
                                    .from("verification_tokens")
                                    .insert({
                                        user_id: userId,
                                        contact_email: userEmail,
                                        token_hash: tokenHash,
                                        expires_at: expiresAt.toISOString(),
                                        action: "user-checkin-reminder-2",
                                    });

                                if (!tokenError) {
                                    const checkinUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/verify-status?token=${rawToken}`;
                                    const { error: sendError } = await sendCheckinReminder2Email(userEmail, checkinUrl, locale);

                                    if (sendError) {
                                        await supabase.from("verification_tokens").delete().eq("token_hash", tokenHash);
                                        results.errors.push(`Email send failed for ${userEmail}: ${sendError}`);
                                    } else {
                                        emailSent = true;
                                    }
                                } else {
                                    results.errors.push(`Token error for ${userEmail}: ${tokenError.message}`);
                                }
                            } else {
                                // Token exists from a prior run — email was previously sent.
                                // State advance must have failed then; advance now to unblock.
                                console.log(`[cron] Dedup: reminder-2 token exists for user ${userId}, advancing state`);
                                emailSent = true;
                            }
                        } else if (attempts === 2) { // Reminder 3 (Day 8)
                            const { data: existingTokens } = await supabase
                                .from("verification_tokens")
                                .select("token_hash")
                                .eq("user_id", userId)
                                .eq("contact_email", userEmail)
                                .eq("action", "user-checkin-reminder-3");

                            if (!existingTokens || existingTokens.length === 0) {
                                const { rawToken, tokenHash } = generateToken();
                                const expiresAt = new Date(now);
                                expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

                                const { error: tokenError } = await supabase
                                    .from("verification_tokens")
                                    .insert({
                                        user_id: userId,
                                        contact_email: userEmail,
                                        token_hash: tokenHash,
                                        expires_at: expiresAt.toISOString(),
                                        action: "user-checkin-reminder-3",
                                    });

                                if (!tokenError) {
                                    const checkinUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/verify-status?token=${rawToken}`;
                                    const { error: sendError } = await sendCheckinReminder3Email(userEmail, checkinUrl, locale);

                                    if (sendError) {
                                        await supabase.from("verification_tokens").delete().eq("token_hash", tokenHash);
                                        results.errors.push(`Email send failed for ${userEmail}: ${sendError}`);
                                    } else {
                                        emailSent = true;
                                    }
                                } else {
                                    results.errors.push(`Token error for ${userEmail}: ${tokenError.message}`);
                                }
                            } else {
                                console.log(`[cron] Dedup: reminder-3 token exists for user ${userId}, advancing state`);
                                emailSent = true;
                            }
                        } else { // Reminder 1 (Day 0)
                            const { data: existingTokens } = await supabase
                                .from("verification_tokens")
                                .select("token_hash")
                                .eq("user_id", userId)
                                .eq("contact_email", userEmail)
                                .eq("action", "user-checkin-reminder-1");

                            if (!existingTokens || existingTokens.length === 0) {
                                const { rawToken, tokenHash } = generateToken();
                                const expiresAt = new Date(now);
                                expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

                                const { error: tokenError } = await supabase
                                    .from("verification_tokens")
                                    .insert({
                                        user_id: userId,
                                        contact_email: userEmail,
                                        token_hash: tokenHash,
                                        expires_at: expiresAt.toISOString(),
                                        action: "user-checkin-reminder-1",
                                    });

                                if (!tokenError) {
                                    // Include the raw token in the URL so the user can confirm
                                    // with a single click without needing to log in
                                    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
                                    const confirmUrl = `${appUrl}/${locale}/confirmar-actividad?token=${rawToken}`;
                                    const { error: sendError } = await sendCheckinReminder1Email(userEmail, confirmUrl, locale);

                                    if (sendError) {
                                        await supabase.from("verification_tokens").delete().eq("token_hash", tokenHash);
                                        results.errors.push(`Email send failed for ${userEmail}: ${String(sendError)}`);
                                    } else {
                                        emailSent = true;
                                    }
                                } else {
                                    results.errors.push(`Token error for ${userEmail}: ${tokenError.message}`);
                                }
                            } else {
                                // Token exists from a prior run — email was previously sent.
                                // State advance must have failed then; advance now to unblock.
                                console.log(`[cron] Dedup: reminder-1 token exists for user ${userId}, advancing state`);
                                emailSent = true;
                            }
                        }

                        if (emailSent) {
                            results.reminders_sent++;
                        }
                    }

                    if (emailSent) {
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
                    }

                    continue;
                }

                // ── BRANCH B: Trusted contact outreach phase ──────────────────
                // Reached when: attempts >= maxReminders (just finished last reminder)
                //           OR: currentStatus === 'awaiting_verification' (sequential outreach in progress)

                // Guard: Resend must be available before any outreach state advances
                const resendClient = getResendClient();
                if (!resendClient) {
                    results.errors.push(`Resend unavailable for user ${userId} — outreach skipped`);
                    continue;
                }

                // Contact selection: message-linked check-in contacts first, fallback to all user contacts
                // (restores original selection behavior; new: includes created_at for stable ordering)
                const { data: userMessages } = await supabase
                    .from('messages')
                    .select(`
                        id,
                        delivery_rules!inner (mode),
                        message_trusted_contacts (
                            trusted_contacts (name, email, created_at)
                        )
                    `)
                    .eq('owner_id', userId)
                    .eq('delivery_rules.mode', 'checkin');

                type ContactEntry = { name: string; email: string; created_at: string | null };
                const linkedContactsMap = new Map<string, ContactEntry>();

                if (userMessages) {
                    userMessages.forEach(msg => {
                        const links = msg.message_trusted_contacts as unknown as
                            Array<{ trusted_contacts: ContactEntry }>;
                        if (Array.isArray(links)) {
                            links.forEach(link => {
                                const c = link.trusted_contacts;
                                if (c?.email) linkedContactsMap.set(c.email, c);
                            });
                        }
                    });
                }

                let contactPool: ContactEntry[];

                if (linkedContactsMap.size > 0) {
                    contactPool = Array.from(linkedContactsMap.values());
                } else {
                    const { data: fallbackContacts } = await supabase
                        .from("trusted_contacts")
                        .select("name, email, created_at")
                        .eq("user_id", userId);
                    contactPool = fallbackContacts || [];
                }

                // Sort for stable sequential ordering
                contactPool.sort((a, b) => {
                    if (a.created_at && b.created_at) return a.created_at.localeCompare(b.created_at);
                    if (a.created_at) return -1;
                    if (b.created_at) return 1;
                    return 0;
                });

                if (contactPool.length === 0) {
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
                const nextContact = contactPool.find(c => !notifiedEmails.has(c.email));

                if (!nextContact) {
                    // All contacts have been notified — outreach complete
                    await supabase
                        .from("checkins")
                        .update({ status: "confirmed_absent" })
                        .eq("user_id", userId);
                    continue;
                }

                // Create token first, then send — roll back token if send fails
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
                    continue; // don't advance state — contact not marked notified
                }

                const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/verify-status?token=${rawToken}`;
                
                const { error: sendError } = await sendTrustedContactNotificationEmail(
                    nextContact.email,
                    senderName,
                    verifyUrl,
                    locale
                );

                if (sendError) {
                    // Roll back token so this contact is not permanently skipped on future runs
                    await supabase
                        .from("verification_tokens")
                        .delete()
                        .eq("token_hash", tokenHash);
                    results.errors.push(`Email send failed for ${nextContact.email}: ${String(sendError)}`);
                    continue; // don't advance state
                }

                // Email confirmed sent — now advance state
                results.trusted_contact_notified++;

                await supabase.from("events").insert({
                    type: "trusted_contact_notified",
                    user_id: userId,
                    metadata: { contact_email: nextContact.email },
                });

                // Determine next state: are there more contacts to notify?
                const remainingContacts = contactPool.filter(
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
