
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { mapSubscriptionToPlan } from '../lib/stripe/utils';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.STRIPE_SECRET_KEY) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function reconcile() {
    console.log("Starting Stripe Reconciliation...");

    let page = 0;
    const pageSize = 100;
    let allProfiles: any[] = [];

    // Fetch all profiles
    while (true) {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, stripe_customer_id, stripe_subscription_id')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error("Error fetching profiles:", error);
            process.exit(1);
        }

        if (!data || data.length === 0) break;
        allProfiles = allProfiles.concat(data);
        page++;
    }

    console.log(`Found ${allProfiles.length} profiles to check.`);

    let stats = {
        total: allProfiles.length,
        processed: 0,
        updated: 0,
        unchanged: 0, // We are updating blindly so hard to track unchanged unless we check before
        errors: 0,
        pro: 0,
        free: 0
    };

    for (const profile of allProfiles) {
        try {
            const { id: userId, stripe_customer_id: customerId, stripe_subscription_id: subId } = profile;

            // Skip users with no stripe info, they are implicitly free
            if (!customerId && !subId) {
                stats.free++;
                stats.processed++;
                continue;
            }

            let statusSrc: { status: Stripe.Subscription.Status, cancelAtPeriodEnd: boolean, currentPeriodEnd: number | null } = {
                status: 'canceled', // Default to canceled/free
                cancelAtPeriodEnd: false,
                currentPeriodEnd: null
            };

            let activeSubId: string | null = null;
            let foundStripeInfo = false;

            if (subId) {
                try {
                    const sub = await stripe.subscriptions.retrieve(subId);
                    const subTyped = sub as unknown as Stripe.Subscription & { current_period_end: number };
                    statusSrc = {
                        status: sub.status,
                        cancelAtPeriodEnd: sub.cancel_at_period_end,
                        currentPeriodEnd: subTyped.current_period_end
                    };
                    activeSubId = sub.id;
                    foundStripeInfo = true;
                } catch (e: any) {
                    if (e.code === 'resource_missing') {
                        // Subscription deleted on Stripe, treat as canceled
                    } else {
                        throw e;
                    }
                }
            }

            // If sub lookup failed or didn't exist, try customer lookup
            if (!foundStripeInfo && customerId) {
                // Priority: Active > Trialing > All
                const activeOrTrialing = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
                let bestSub = activeOrTrialing.data[0];

                if (!bestSub) {
                    const trialing = await stripe.subscriptions.list({ customer: customerId, status: 'trialing', limit: 1 });
                    bestSub = trialing.data[0];
                }

                if (!bestSub) {
                    const anySub = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 1 });
                    bestSub = anySub.data[0];
                }

                if (bestSub) {
                    const bestSubTyped = bestSub as unknown as Stripe.Subscription & { current_period_end: number };
                    statusSrc = {
                        status: bestSub.status,
                        cancelAtPeriodEnd: bestSub.cancel_at_period_end,
                        currentPeriodEnd: bestSubTyped.current_period_end
                    };
                    activeSubId = bestSub.id;
                }
            }

            const mapping = mapSubscriptionToPlan(statusSrc.status, statusSrc.cancelAtPeriodEnd, statusSrc.currentPeriodEnd);

            if (mapping.plan === 'pro') stats.pro++;
            else stats.free++;

            const currentPeriodEndIso = statusSrc.currentPeriodEnd ? new Date(statusSrc.currentPeriodEnd * 1000).toISOString() : null;

            // Upsert User Subscriptions (Source of Truth)
            const { error: subError } = await supabase
                .from("user_subscriptions")
                .upsert({
                    user_id: userId,
                    plan: mapping.plan,
                    status: mapping.effectiveStatus,
                    current_period_end: currentPeriodEndIso,
                    cancel_at_period_end: statusSrc.cancelAtPeriodEnd,
                    stripe_customer_id: customerId,
                    stripe_subscription_id: activeSubId,
                    updated_at: new Date().toISOString()
                });

            if (subError) throw subError;

            // Update Profiles (Legacy)
            const { error: profError } = await supabase
                .from("profiles")
                .update({
                    plan: mapping.plan,
                    plan_status: mapping.effectiveStatus,
                    plan_ends_at: mapping.effectiveUntil,
                    stripe_customer_id: customerId,
                    stripe_subscription_id: activeSubId
                })
                .eq("id", userId);

            if (profError) {
                // Ignore missing column errors if any, but log warning
                if (profError.code === 'PGRST204') {
                    // retry minimal
                } else {
                    throw profError;
                }
            }

            stats.updated++;
            stats.processed++;

            if (stats.processed % 20 === 0) {
                process.stdout.write(`.`);
            }

        } catch (err) {
            console.error(`\nError processing user ${profile.id}:`, err);
            stats.errors++;
        }
    }

    console.log("\n\n--- Reconciliation Report ---");
    console.log(`Total Profiles: ${stats.total}`);
    console.log(`Processed: ${stats.processed}`);
    console.log(`Updated (Synced): ${stats.updated}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`Final Pro Count: ${stats.pro}`);
    console.log(`Final Free Count: ${stats.free}`);

    if (stats.errors > 0) process.exit(1);
}

reconcile();
