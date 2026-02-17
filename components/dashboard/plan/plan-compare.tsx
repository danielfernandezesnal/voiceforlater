'use client'

const features = [
    {
        name: 'Mensajes programados',
        free: true,
        pro: true,
        freeNote: null,
        proNote: null,
    },
    {
        name: 'Mensaje de texto',
        free: true,
        pro: true,
        freeNote: null,
        proNote: null,
    },
    {
        name: 'Mensaje de audio',
        free: true,
        pro: true,
        freeNote: null,
        proNote: null,
    },
    {
        name: 'Mensaje de video',
        free: false,
        pro: true,
        freeNote: null,
        proNote: null,
    },
    {
        name: 'Contactos de confianza',
        free: true,
        pro: true,
        freeNote: 'Hasta 1',
        proNote: 'Hasta 3',
    },
    {
        name: 'Mensajes sellados e inalterables',
        free: false,
        pro: true,
        freeNote: null,
        proNote: null,
    },
    {
        name: 'Confirmación de entrega',
        free: false,
        pro: true,
        freeNote: null,
        proNote: null,
    },
    {
        name: 'Soporte prioritario',
        free: false,
        pro: true,
        freeNote: null,
        proNote: null,
    },
]

interface PlanCompareProps {
    currentPlan: string
}

export function PlanCompare({ currentPlan }: PlanCompareProps) {
    const isFree = currentPlan.toLowerCase() !== 'pro'

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            {/* Column Headers */}
            <div className="grid grid-cols-[1fr_100px_100px] sm:grid-cols-[1fr_120px_120px] border-b-2 border-stone-200 bg-stone-100 rounded-t-xl">
                <div className="py-5 px-4 sm:px-5">
                    <span className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Funcionalidad</span>
                </div>
                <div className={`py-5 px-4 sm:px-5 text-center ${isFree ? 'bg-stone-200/40' : ''}`}>
                    <span className="text-sm font-bold text-stone-700">Free</span>
                </div>
                <div className="py-5 px-4 sm:px-5 text-center bg-primary rounded-tr-xl">
                    <span className="text-sm font-bold text-white uppercase tracking-wider">✨ PRO</span>
                </div>
            </div>

            {/* Feature Rows */}
            {features.map((feature, i) => (
                <div
                    key={feature.name}
                    className={`grid grid-cols-[1fr_100px_100px] sm:grid-cols-[1fr_120px_120px] ${i < features.length - 1 ? 'border-b border-border/50' : ''
                        } hover:bg-muted/20 transition-colors`}
                >
                    <div className="p-4 sm:p-5 flex items-center">
                        <span className="text-sm text-foreground">{feature.name}</span>
                    </div>
                    <div className={`p-4 sm:p-5 flex flex-col items-center justify-center ${isFree ? 'bg-primary/[0.02]' : ''}`}>
                        {feature.free ? (
                            <>
                                <CheckIcon />
                                {feature.freeNote && (
                                    <span className="text-[11px] text-muted-foreground mt-0.5">{feature.freeNote}</span>
                                )}
                            </>
                        ) : (
                            <DashIcon />
                        )}
                    </div>
                    <div className="p-4 sm:p-5 flex flex-col items-center justify-center bg-emerald-50/60">
                        {feature.pro ? (
                            <>
                                <CheckIcon />
                                {feature.proNote && (
                                    <span className="text-[11px] text-muted-foreground mt-0.5">{feature.proNote}</span>
                                )}
                            </>
                        ) : (
                            <DashIcon />
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

function CheckIcon() {
    return (
        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    )
}

function DashIcon() {
    return (
        <span className="w-4 h-[2px] bg-border/80 rounded-full block" />
    )
}
