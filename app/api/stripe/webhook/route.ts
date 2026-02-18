import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { trackServerEvent } from "@/lib/analytics/trackEvent";

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
                const { error: subError } = await supabase
                    .from("user_subscriptions")
                    .upsert({
                        user_id: userId,
                        plan: "pro",
                        stripe_customer_id: session.customer as string,
                        stripe_subscription_id: session.subscription as string,
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
                        stripe_customer_id: session.customer as string,
                        stripe_subscription_id: session.subscription as string,
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
                            stripe_customer_id: session.customer as string,
                            stripe_subscription_id: session.subscription as string,
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
                            subscription_id: session.subscription,
                            customer_id: session.customer,
                        },
                    });

                    // --- Product Analytics ---
                    const subscriptionId =
                        typeof session.subscription === "string"
                            ? session.subscription
                            : session.subscription && typeof session.subscription === "object" && "id" in session.subscription
                                ? (session.subscription as { id: string }).id
                                : null;

                    await trackServerEvent({
                        event: 'subscription.created',
                        userId: userId,
                        metadata: { subscription_id: subscriptionId }
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

                const status = subscription.status;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000).toISOString();

                // Find user by subscription ID or customer ID if metadata missing
                let targetUserId = userId;
                if (!targetUserId) {
                    const { data: sub } = await supabase
                        .from("user_subscriptions")
                        .select("user_id")
                        .or(`stripe_subscription_id.eq.${subscription.id},stripe_customer_id.eq.${subscription.customer as string}`)
                        .single();
                    targetUserId = sub?.user_id;
                }

                if (targetUserId) {
                    await supabase
                        .from("user_subscriptions")
                        .update({
                            status: status,
                            current_period_end: currentPeriodEnd,
                            updated_at: new Date().toISOString()
                        })
                        .eq("user_id", targetUserId);

                    // Sync profile
                    await supabase
                        .from("profiles")
                        .update({
                            plan_status: status,
                            plan_ends_at: subscription.cancel_at
                                ? new Date(subscription.cancel_at * 1000).toISOString()
                                : null,
                        })
                        .eq("id", targetUserId);
                }
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata?.user_id;

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

                if (!targetUserId) {
                    const { data: sub } = await supabase
                        .from("user_subscriptions")
                        .select("user_id")
                        .eq("stripe_customer_id", subscription.customer as string)
                        .single();
                    targetUserId = sub?.user_id;
                }

                if (targetUserId) {
                    // Downgrade to FREE
                    await supabase
                        .from("user_subscriptions")
                        .update({
                            plan: "free",
                            status: "canceled",
                            stripe_subscription_id: null,
                            updated_at: new Date().toISOString()
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

                    console.log(`User ${targetUserId} downgraded to FREE`);
                }
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("stripe_customer_id", customerId)
                    .single();

                if (profile) {
                    await supabase
                        .from("user_subscriptions")
                        .update({
                            status: "past_due",
                            updated_at: new Date().toISOString()
                        })
                        .eq("user_id", profile.id);

                    await supabase
                        .from("profiles")
                        .update({ plan_status: "past_due" })
                        .eq("id", profile.id);

                    // Log event
                    await supabase.from("events").insert({
                        type: "payment_failed",
                        user_id: profile.id,
                        metadata: { invoice_id: invoice.id },
                    });
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
