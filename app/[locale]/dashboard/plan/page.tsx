import { PlanCurrentCard } from "@/components/dashboard/plan/plan-current-card";
import { PlanCompare } from "@/components/dashboard/plan/plan-compare";
import { PlanCTA } from "@/components/dashboard/plan/plan-cta";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

    const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();

    // Default to 'free' if null, and Capitalize for display (free -> Free, pro -> Pro)
    const rawPlan = profile?.plan || 'free';
    const planName = rawPlan.charAt(0).toUpperCase() + rawPlan.slice(1);
    const status = "Activo"; // TODO: obtener estado real de suscripción (active, trialing, past_due)

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* A) Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mi Plan</h1>
                <p className="text-muted-foreground mt-2">
                    Revisá tu plan actual y las funcionalidades disponibles.
                </p>
            </div>

            {/* B) Current Plan Card */}
            <PlanCurrentCard planName={planName} status={status} />

            {/* C) CTA */}
            <PlanCTA planName={planName} locale={locale} />

            {/* D) Feature Comparison */}
            <PlanCompare currentPlan={planName} />
        </div>
    );
}
