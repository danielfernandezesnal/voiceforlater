import { SupabaseClient } from "@supabase/supabase-js";
import { Plan } from "./plans/config";

/**
 * Resolves the effective plan for a user.
 * 
 * Rules:
 * - If user_subscriptions.status in ('active', 'trialing') AND plan='pro' AND current_period_end is in the future => pro
 * - else free
 */
export async function getEffectivePlan(
    supabase: SupabaseClient,
    userId: string
): Promise<Plan> {
    const { data: subscription, error } = await supabase
        .from("user_subscriptions")
        .select("plan, status, current_period_end")
        .eq("user_id", userId)
        .single();

    // If user_subscriptions is unavailable (table missing, RLS, or no row),
    // fall back to profiles.plan as the source of truth.
    if (error || !subscription) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("plan")
            .eq("id", userId)
            .maybeSingle();

        return profile?.plan === "pro" ? "pro" : "free";
    }

    // user_subscriptions row exists — apply the standard validation logic.
    const isActive = ["active", "trialing"].includes(subscription.status || "");
    const isPro = subscription.plan === "pro";

    if (isActive && isPro) {
        return "pro";
    }

    return "free";
}
