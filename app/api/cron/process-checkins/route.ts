import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { type Plan, getMaxReminders } from "@/lib/plans";

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
                        // Send email to each unique contact
                        for (const contact of contactsToNotify.values()) {
                            await resendClientForTrusted.emails.send({
                                from: "Carry my Words <noreply@voiceforlater.com>",
                                to: contact.email,
                                subject: "You’ve been chosen as a trusted contact",
                                html: `
                                    <h2>${contact.name ? `Hello ${contact.name},` : 'Hello,'}</h2>
                                    <h3 style="color: #6366f1;">You’ve been chosen as a trusted contact</h3>
                                    <p>${userEmail} has chosen you as a trusted contact on Carry my Words.</p>
                                    <p>This means that if this person does not confirm their activity within the defined period, you may receive a notification related to the messages they have scheduled.</p>
                                    <p>No action is required from you at this time. We just wanted to inform you and thank you for being part of ${userEmail}’s circle of trust.</p>
                                    <br/>
                                    <p>—<br/>
                                    <strong>Carry my Words</strong><br/>
                                    <span style="color: #666; font-style: italic;">So your words arrive when they’re meant to.</span></p>
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
