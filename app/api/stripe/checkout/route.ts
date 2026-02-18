import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import { trackServerEvent } from "@/lib/analytics/trackEvent";

// Lazy init to avoid build errors
function getStripe() {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    return new Stripe(process.env.STRIPE_SECRET_KEY);
}

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for PRO subscription
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verify user is authenticated
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const stripe = getStripe();
        const priceId = process.env.STRIPE_PRICE_PRO_YEAR;

        if (!priceId) {
            console.error("STRIPE_PRICE_PRO_YEAR not configured");
            return NextResponse.json(
                { error: "Subscription not configured" },
                { status: 500 }
            );
        }

        // Get or create Stripe customer
        const { data: profile } = await supabase
            .from("profiles")
            .select("stripe_customer_id")
            .eq("id", user.id)
            .single();

        let customerId = profile?.stripe_customer_id;

        if (!customerId) {
            // Create new Stripe customer
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    supabase_user_id: user.id,
                },
            });
            customerId = customer.id;

            // Save customer ID to profile
            await supabase
                .from("profiles")
                .update({ stripe_customer_id: customerId })
                .eq("id", user.id);
        }

        // Create checkout session
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const body = await request.json().catch(() => ({}));
        const { redirectPath } = body;

        // Default to dashboard, or use provided path (must be relative for security)
        const successPath = redirectPath && redirectPath.startsWith('/')
            ? redirectPath
            : '/en/dashboard?upgrade=success';

        let session;
        try {
            await trackServerEvent({
                event: 'checkout.started',
                userId: user.id
            });

            session = await stripe.checkout.sessions.create({
                customer: customerId,
                mode: "subscription",
                payment_method_types: ["card"],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                success_url: `${appUrl}${successPath}`,
                cancel_url: `${appUrl}/en/dashboard?upgrade=cancelled`,
                metadata: {
                    user_id: user.id,
                },
                subscription_data: {
                    metadata: {
                        user_id: user.id,
                    },
                },
            });
        } catch (sessionError: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            // Handle invalid customer ID (e.g. deleted in Stripe or env mismatch)
            if (sessionError?.code === 'resource_missing' && sessionError?.param === 'customer') {
                console.log("Customer missing in Stripe, creating new one...");
                const customer = await stripe.customers.create({
                    email: user.email,
                    metadata: {
                        supabase_user_id: user.id,
                    },
                });
                customerId = customer.id;

                // Update Profile
                await supabase
                    .from("profiles")
                    .update({ stripe_customer_id: customerId })
                    .eq("id", user.id);

                // Retry session creation
                session = await stripe.checkout.sessions.create({
                    customer: customerId,
                    mode: "subscription",
                    payment_method_types: ["card"],
                    line_items: [{ price: priceId, quantity: 1 }],
                    success_url: `${appUrl}${successPath}`,
                    cancel_url: `${appUrl}/en/dashboard?upgrade=cancelled`,
                    metadata: { user_id: user.id },
                    subscription_data: { metadata: { user_id: user.id } },
                });
            } else {
                throw sessionError;
            }
        }

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error("Checkout error:", error);

        // Log more details for debugging
        if (error instanceof Error) {
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create checkout session" },
            { status: 500 }
        );
    }
}
