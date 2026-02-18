import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { trackServerEvent } from "@/lib/analytics/trackEvent";
import { getResourceId, mapSubscriptionToPlan } from "@/lib/stripe/utils";

// Use service role for webhook operations (bypasses RLS)
function getAdminSupabase() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

function getStripe() {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// Helper to safely get ID from string or object
// Moved to @/lib/stripe/utils

/**
 * Normalize Stripe subscription status to internal Plan
 * Moved to @/lib/stripe/utils
 */

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events
 */
export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error("STRIPE_WEBHOOK_SECRET not configured");
        return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    let event: Stripe.Event;
    const stripe = getStripe();

    console.log("--- STRIPE WEBHOOK START ---");
    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        console.log("Event Type:", event.type);
    } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.user_id;

                if (!userId) {
                    console.error("No user_id in session metadata");
                    break;
                }

                // Update user_subscriptions (Authoritative)
                const customerId = getResourceId(session.customer);
                const subId = getResourceId(session.subscription);

                const { error: subError } = await supabase
                    .from("user_subscriptions")
                    .upsert({
                        user_id: userId,
                        plan: "pro",
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subId,
                        status: "active",
                        updated_at: new Date().toISOString()
                    });

                if (subError) {
                    console.error("Failed to update user_subscriptions:", subError);
                    return NextResponse.json({ error: "Database error" }, { status: 500 });
                }

                // Update profile (Legacy/Frontend Compatibility)
                let { error } = await supabase
                    .from("profiles")
                    .update({
                        plan: "pro",
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subId,
                        plan_status: "active",
                    })
                    .eq("id", userId);

                // Fallback for missing columns (plan_status)
                if (error && error.code === 'PGRST204') {
                    console.warn("Fallback: Missing plan_status column, trying basic update");
                    const { error: retryError } = await supabase
                        .from("profiles")
                        .update({
                            plan: "pro",
                            stripe_customer_id: customerId,
                            stripe_subscription_id: subId,
                        })
                        .eq("id", userId);
                    error = retryError;
                }

                if (error) {
                    console.error("Failed to update profile:", error);
                    return NextResponse.json({ error: "Database error" }, { status: 500 });
                }

                // Log event - Try/catch to avoid failing webhook if events table is missing something
                try {
                    await supabase.from("events").insert({
                        type: "subscription_created",
                        user_id: userId,
                        metadata: {
                            subscription_id: subId,
                            customer_id: customerId,
                        },
                    });

                    // --- Product Analytics ---
                    await trackServerEvent({
                        event: 'subscription.created',
                        userId: userId,
                        metadata: { subscription_id: subId }
                    });
                } catch (e) {
                    console.error("Failed to log event:", e);
                }

                console.log(`User ${userId} upgraded to PRO`);
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata?.user_id;

                // current_period_end is missing in some Stripe type definitions despite being present in API
                const sub = subscription as Stripe.Subscription & { current_period_end: number };

                const { plan, effectiveStatus, effectiveUntil } = mapSubscriptionToPlan(
                    subscription.status,
                    subscription.cancel_at_period_end,
                    sub.current_period_end
                );

                const customerId = getResourceId(subscription.customer);
                const currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();

                // Find user by subscription ID or customer ID if metadata missing
                let targetUserId = userId;
                if (!targetUserId) {
                    let query = supabase
                        .from("user_subscriptions")
                        .select("user_id");

                    if (customerId) {
                        query = query.or(`stripe_subscription_id.eq.${subscription.id},stripe_customer_id.eq.${customerId}`);
                    } else {
                        query = query.eq("stripe_subscription_id", subscription.id);
                    }

                    const { data: sub } = await query.single();
                    targetUserId = sub?.user_id;
                }

                if (targetUserId) {
                    // Update User Subscriptions (Source of Truth)
                    await supabase
                        .from("user_subscriptions")
                        .update({
                            plan: plan,
                            status: effectiveStatus,
                            current_period_end: currentPeriodEnd,
                            cancel_at_period_end: subscription.cancel_at_period_end,
                            updated_at: new Date().toISOString()
                        })
                        .eq("user_id", targetUserId);

                    // Sync profile (Legacy Mirror)
                    await supabase
                        .from("profiles")
                        .update({
                            plan: plan,
                            plan_status: effectiveStatus,
                            plan_ends_at: effectiveUntil,
                        })
                        .eq("id", targetUserId);

                    console.log(`Updated subscription for user ${targetUserId}: ${plan} (${effectiveStatus})`);
                } else {
                    console.warn(`Could not find user for subscription update: ${subscription.id}`);
                }
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata?.user_id;
                const customerId = getResourceId(subscription.customer);

                // Find user by subscription ID or customer ID
                let targetUserId = userId;

                if (!targetUserId) {
                    const { data: sub } = await supabase
                        .from("user_subscriptions")
                        .select("user_id")
                        .eq("stripe_subscription_id", subscription.id)
                        .single();
                    targetUserId = sub?.user_id;
                }

                if (!targetUserId && customerId) {
                    const { data: sub } = await supabase
                        .from("user_subscriptions")
                        .select("user_id")
                        .eq("stripe_customer_id", customerId)
                        .single();
                    targetUserId = sub?.user_id;
                }

                if (targetUserId) {
                    // Downgrade to FREE
                    const now = new Date().toISOString();

                    await supabase
                        .from("user_subscriptions")
                        .update({
                            plan: "free",
                            status: "canceled",
                            stripe_subscription_id: null,
                            updated_at: now
                        })
                        .eq("user_id", targetUserId);

                    // Legacy Update
                    await supabase
                        .from("profiles")
                        .update({
                            plan: "free",
                            plan_status: "canceled",
                            stripe_subscription_id: null,
                        })
                        .eq("id", targetUserId);

                    // Log event
                    await supabase.from("events").insert({
                        type: "subscription_canceled",
                        user_id: targetUserId,
                        metadata: { subscription_id: subscription.id },
                    });

                    // --- Product Analytics ---
                    await trackServerEvent({
                        event: 'subscription.canceled',
                        userId: targetUserId,
                        metadata: { subscription_id: subscription.id }
                    });

                    console.log(`User ${targetUserId} downgraded to FREE (Subscription Deleted)`);
                }
                break;
            }

            case "invoice.payment_failed": {
                // Cast to any to avoid property missing error if types are outdated
                const invoice = event.data.object as any;
                const subId = getResourceId(invoice.subscription);
                const customerId = getResourceId(invoice.customer);

                // Attempt to fetch fresh subscription status to be authoritative
                let mappedPlan: { plan: 'free' | 'pro', effectiveStatus: string, effectiveUntil: string | null } = {
                    plan: 'free',
                    effectiveStatus: 'past_due',
                    effectiveUntil: null
                };

                let currentPeriodEndStr: string | null = null;
                let cancelAtPeriodEndVal = false;

                if (subId) {
                    try {
                        const freshSub = await stripe.subscriptions.retrieve(subId);
                        const freshSubTyped = freshSub as unknown as Stripe.Subscription & { current_period_end: number };

                        const mapped = mapSubscriptionToPlan(
                            freshSub.status,
                            freshSub.cancel_at_period_end,
                            freshSubTyped.current_period_end
                        );
                        mappedPlan = mapped;
                        currentPeriodEndStr = new Date(freshSubTyped.current_period_end * 1000).toISOString();
                        cancelAtPeriodEndVal = freshSub.cancel_at_period_end;
                    } catch (fetchErr) {
                        console.error(`Failed to fetch subscription ${subId} in payment_failed`, fetchErr);
                        // Fallback: stay on defaults (free/past_due)
                    }
                }

                if (!customerId) {
                    console.error("No customer ID in invoice");
                    break;
                }

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("stripe_customer_id", customerId)
                    .single();

                if (profile) {
                    // Normalize: Update both tables
                    await supabase
                        .from("user_subscriptions")
                        .update({
                            plan: mappedPlan.plan,
                            status: mappedPlan.effectiveStatus,
                            ...(currentPeriodEndStr && { current_period_end: currentPeriodEndStr }),
                            cancel_at_period_end: cancelAtPeriodEndVal,
                            updated_at: new Date().toISOString()
                        })
                        .eq("user_id", profile.id);

                    await supabase
                        .from("profiles")
                        .update({
                            plan: mappedPlan.plan,
                            plan_status: mappedPlan.effectiveStatus,
                            plan_ends_at: mappedPlan.effectiveUntil
                        })
                        .eq("id", profile.id);

                    // Log event
                    await supabase.from("events").insert({
                        type: "payment_failed",
                        user_id: profile.id,
                        metadata: { invoice_id: invoice.id, subscription_id: subId },
                    });

                    console.log(`User ${profile.id} processed for payment_failed: ${mappedPlan.plan} (${mappedPlan.effectiveStatus})`);
                }
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Webhook handler error:", error);
        return NextResponse.json({ error: "Handler error" }, { status: 500 });
    }
}
