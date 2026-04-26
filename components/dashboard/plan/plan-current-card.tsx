'use client'

interface PlanCurrentCardProps {
    planName: string
    status: string
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
    active:   { label: 'Activo',    className: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
    trialing: { label: 'Trial',     className: 'bg-blue-50 text-blue-700 border border-blue-100' },
    past_due: { label: 'Vencido',   className: 'bg-amber-50 text-amber-700 border border-amber-100' },
    canceled: { label: 'Cancelado', className: 'bg-red-50 text-red-700 border border-red-100' },
    unpaid:   { label: 'Sin pago',  className: 'bg-red-50 text-red-700 border border-red-100' },
}

export function PlanCurrentCard({ planName, status }: PlanCurrentCardProps) {
    const isPro = planName.toLowerCase() === 'pro'
    const badge = STATUS_LABELS[status]
    const accentColor = isPro ? '#C4623A' : '#a89880'

    return (
        <div
            style={{
                background: '#fffdf9',
                border: '1px solid #e8e0d0',
                borderLeft: `3px solid ${accentColor}`,
                borderRadius: '4px',
            }}
            className="p-5 flex items-center justify-between gap-4"
        >
            <div>
                <p style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9a8070', fontWeight: 500, marginBottom: '5px' }}>
                    Plan actual
                </p>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#2A2018', fontWeight: 300, lineHeight: 1.2 }}>
                    {isPro ? 'Pro' : 'Free'}
                </h2>
            </div>
            {badge && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                    {badge.label}
                </span>
            )}
        </div>
    )
}
