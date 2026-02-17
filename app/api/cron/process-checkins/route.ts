import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { type Plan, getMaxReminders } from "@/lib/plans";
import crypto from 'crypto';

// Generate secure token (helper function inline for now to avoid large diffs if util not available in easy import path)
function generateToken() {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, tokenHash };
}

// This endpoint is called by Vercel Cron
// It processes overdue check-ins and sends notifications

// Use service role for admin operations
function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// Lazy initialization of Resend to avoid build errors
function getResendClient() {
    if (!process.env.RESEND_API_KEY) {
        return null;
    }
    return new Resend(process.env.RESEND_API_KEY);
}

/**
 * GET /api/cron/process-checkins
 * Called by Vercel Cron daily to process overdue check-ins
 * 
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-checkins",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getAdminClient();
    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const initialData: any = {
        processed: 0,
        reminders_sent: 0,
        trusted_contact_notified: 0,
        messages_delivered: 0,
        errors: [] as string[],
    };
    const results = initialData;

    try {
        // Get all overdue checkins that are not yet confirmed_absent
        const { data: overdueCheckins, error } = await supabase
            .from("checkins")
            .select(`
        *,
        profiles!inner (
          id
        )
      `)
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

            try {
                // Get user profile and plan
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("plan")
                    .eq("id", userId)
                    .single();

                const plan = (profile?.plan as Plan) || "free";
                const maxReminders = getMaxReminders(plan);

                // Get user email from auth
                const { data: authUser } = await supabase.auth.admin.getUserById(userId);
                const userEmail = authUser?.user?.email;

                if (attempts < maxReminders) {
                    // Send reminder to user
                    const resendClient = getResendClient();
                    if (userEmail && resendClient) {
                        await resendClient.emails.send({
                            from: "VoiceForLater <noreply@voiceforlater.com>",
                            to: userEmail,
                            subject: "⏰ Check-in reminder - VoiceForLater",
                            html: `
                <h2>Time to check in!</h2>
                <p>Your scheduled check-in is overdue. Please confirm you're still active.</p>
                <p>Attempt ${attempts + 1} of 3</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/checkin/confirm" 
                   style="display:inline-block;padding:12px 24px;background:#8b5cf6;color:white;text-decoration:none;border-radius:8px;">
                  Confirm I'm Active
                </a>
                <p style="color:#666;font-size:12px;margin-top:20px;">
                  If you don't respond after 3 attempts, we'll contact your trusted contact.
                </p>
              `,
                        });
                        results.reminders_sent++;
                    }

                    // Increment attempts and set next reminder (24h later)
                    const nextDue = new Date();
                    nextDue.setDate(nextDue.getDate() + 1);

                    await supabase
                        .from("checkins")
                        .update({
                            attempts: attempts + 1,
                            next_due_at: nextDue.toISOString(),
                            status: "pending",
                        })
                        .eq("user_id", userId);

                    // Log event
                    await supabase.from("events").insert({
                        type: "checkin_reminder_sent",
                        user_id: userId,
                        metadata: { attempt: attempts + 1 },
                    });
                } else {
                    // 3 attempts exhausted - notify trusted contacts linked to check-in messages

                    // 1. Fetch messages with check-in mode and their contacts
                    const { data: userMessages } = await supabase
                        .from('messages')
                        .select(`
                            id,
                            delivery_rules!inner (mode),
                            message_trusted_contacts (
                                trusted_contacts (name, email)
                            )
                        `)
                        .eq('owner_id', userId)
                        .eq('delivery_rules.mode', 'checkin');

                    // 2. Aggregate unique contacts
                    const contactsToNotify = new Map<string, { name: string, email: string }>();

                    if (userMessages) {
                        userMessages.forEach(msg => {
                            // Supabase returns array for HasMany
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const links = msg.message_trusted_contacts as any[];
                            if (Array.isArray(links)) {
                                links.forEach(link => {
                                    const contact = link.trusted_contacts;
                                    if (contact && contact.email) {
                                        contactsToNotify.set(contact.email, contact);
                                    }
                                });
                            }
                        });
                    }

                    // Fallback: If no message-specific contacts, try to find any trusted contact for the user
                    if (contactsToNotify.size === 0) {
                        const { data: fallbackContact } = await supabase
                            .from("trusted_contacts")
                            .select("name, email")
                            .eq("user_id", userId)
                            .limit(1)
                            .maybeSingle();

                        if (fallbackContact) {
                            contactsToNotify.set(fallbackContact.email, fallbackContact);
                        }
                    }

                    const resendClientForTrusted = getResendClient();
                    if (resendClientForTrusted && contactsToNotify.size > 0) {
                        // Send email to each unique contact with SECURE TOKEN
                        for (const contact of contactsToNotify.values()) {

                            // 1. Generate secure token
                            const { rawToken, tokenHash } = generateToken();
                            const expiresAt = new Date();
                            expiresAt.setHours(expiresAt.getHours() + 48); // 48h expiration

                            // 2. Store token hash in DB
                            const { error: tokenError } = await supabase
                                .from('verification_tokens')
                                .insert({
                                    user_id: userId,
                                    contact_email: contact.email,
                                    token_hash: tokenHash,
                                    expires_at: expiresAt.toISOString(),
                                    action: 'verify-status'
                                });

                            if (tokenError) {
                                console.error(`Error storing token for ${contact.email}:`, tokenError);
                                results.errors.push(`Token error for ${contact.email}: ${tokenError.message}`);
                                continue;
                            }

                            // 3. Send actionable email
                            const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-status?token=${rawToken}`;

                            await resendClientForTrusted.emails.send({
                                from: "Carry my Words <noreply@voiceforlater.com>",
                                to: contact.email,
                                subject: "ACTION REQUIRED: Confirm status for " + userEmail,
                                html: `
                                    <h2>${contact.name ? `Hello ${contact.name},` : 'Hello,'}</h2>
                                    <h3 style="color: #6366f1;">Action Required: Verify Status</h3>
                                    <p>${userEmail} has missed their scheduled check-ins on Carry my Words.</p>
                                    <p>As a trusted contact, we need you to verify if they are unable to access their account.</p>
                                    
                                    <div style="margin: 24px 0; padding: 16px; background-color: #fff1f2; border-left: 4px solid #e11d48; border-radius: 4px;">
                                        <p style="margin: 0; font-weight: bold; color: #9f1239;">Is ${userEmail} unavailable?</p>
                                        <p style="margin: 8px 0 0 0; color: #be123c;">If you confirm, their scheduled messages will be released to recipients.</p>
                                    </div>

                                    <a href="${verificationLink}" 
                                       style="display:inline-block;padding:12px 24px;background:#e11d48;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">
                                      Verify Status Now
                                    </a>
                                    
                                    <p style="margin-top:24px; font-size:14px; color:#666;">
                                        If this is a false alarm or you know they are fine, please use the link above to report it secure and stop further notifications.
                                    </p>
                                    <p style="font-size:12px; color:#999;">Link expires in 48 hours.</p>
                                    <br/>
                                    <p>—<br/>
                                    <strong>Carry my Words</strong></p>
                                `,
                            });
                            results.trusted_contact_notified++;
                        }
                    }

                    // Update checkin status
                    await supabase
                        .from("checkins")
                        .update({ status: "confirmed_absent" })
                        .eq("user_id", userId);

                    // Log event
                    await supabase.from("events").insert({
                        type: "trusted_contact_notified",
                        user_id: userId,
                        metadata: {
                            contact_count: contactsToNotify.size,
                            contacts: Array.from(contactsToNotify.keys())
                        },
                    });

                    // Note: Actual message delivery would be done after trusted contact confirms
                    // For MVP, we stop here and await manual confirmation
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
