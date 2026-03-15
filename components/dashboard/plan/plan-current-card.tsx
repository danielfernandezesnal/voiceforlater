'use client'

interface PlanCurrentCardProps {
    planName: string
    status: string
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
    active: { label: 'Activo', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    trialing: { label: 'Trial', className: 'bg-blue-50 text-blue-700 border-blue-100' },
    past_due: { label: 'Vencido', className: 'bg-amber-50 text-amber-700 border-amber-100' },
    canceled: { label: 'Cancelado', className: 'bg-red-50 text-red-700 border-red-100' },
    unpaid: { label: 'Sin pago', className: 'bg-red-50 text-red-700 border-red-100' },
}

export function PlanCurrentCard({ planName, status }: PlanCurrentCardProps) {
    const isPro = planName.toLowerCase() === 'pro'

    // Only show the badge if the status adds meaningful info (not "free" on a pro plan)
    const badge = STATUS_LABELS[status]

    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground mb-1">Plan actual</p>
                    <div className="flex items-center gap-3">
                        <h2 className="font-serif font-semibold text-lg text-foreground mb-4">
                            {isPro ? '✨ Pro' : 'Free'}
                        </h2>
                        {badge && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}>
                                {badge.label}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
