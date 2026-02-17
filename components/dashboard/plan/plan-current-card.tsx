'use client'

interface PlanCurrentCardProps {
    planName: string
    status: string
}

export function PlanCurrentCard({ planName, status }: PlanCurrentCardProps) {
    const isPro = planName.toLowerCase() === 'pro'

    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground mb-1">Plan actual</p>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight">
                            {isPro ? '✨ Pro' : 'Free'}
                        </h2>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {status}
                        </span>
                    </div>
                </div>

            </div>
        </div>
    )
}
