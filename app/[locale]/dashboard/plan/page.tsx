import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePlan } from "@/lib/plan-resolver";
import { PlanUpgradeSuccess } from "@/components/dashboard/plan/plan-upgrade-success";
import { PlanCurrentCard } from "@/components/dashboard/plan/plan-current-card";
import { PlanCompare } from "@/components/dashboard/plan/plan-compare";
import { PlanCTA } from "@/components/dashboard/plan/plan-cta";

export default async function PlanPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/auth/login`);
    }

    // --- Authoritative plan resolution ---
    // getEffectivePlan() reads user_subscriptions first, falls back to profiles.plan.
    const effectivePlan = await getEffectivePlan(supabase, user.id);

    // --- Live subscription status from source of truth ---
    // Read status and cancel_at_period_end directly from user_subscriptions.
    // Falls back to "free" for users with no subscription row.
    const { data: subscription } = await supabase
        .from("user_subscriptions")
        .select("status, cancel_at_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

    // Real subscription status (active, trialing, past_due, canceled, unpaid) or "free".
    // cancel_at_period_end is surfaced as a separate boolean — never merged into status.
    const status = subscription?.status ?? "free";
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const isCanceling = subscription?.cancel_at_period_end === true;

    // Capitalize plan name for display (free → Free, pro → Pro)
    const planName = effectivePlan.charAt(0).toUpperCase() + effectivePlan.slice(1);

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* A) Upgrade Success Banner (Client Component) */}
            <PlanUpgradeSuccess currentPlan={planName} locale={locale} />

            {/* B) Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mi Plan</h1>

            </div>

            {/* C) Current Plan Card */}
            <PlanCurrentCard planName={planName} status={status} />

            {/* D) CTA */}
            <PlanCTA planName={planName} locale={locale} />

            {/* E) Feature Comparison */}
            <PlanCompare currentPlan={planName} />
        </div>
    );
}
