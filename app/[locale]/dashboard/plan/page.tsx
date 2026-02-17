import { PlanCurrentCard } from "@/components/dashboard/plan/plan-current-card";
import { PlanCompare } from "@/components/dashboard/plan/plan-compare";
import { PlanCTA } from "@/components/dashboard/plan/plan-cta";

export default function PlanPage() {
    // TODO: reemplazar con plan real desde Supabase (viene del layout via props o server fetch)
    const mockPlan = { name: "Free", status: "Activo" };

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
            <PlanCurrentCard planName={mockPlan.name} status={mockPlan.status} />

            {/* C) Feature Comparison */}
            <PlanCompare currentPlan={mockPlan.name} />

            {/* D) CTA */}
            <PlanCTA planName={mockPlan.name} />
        </div>
    );
}
