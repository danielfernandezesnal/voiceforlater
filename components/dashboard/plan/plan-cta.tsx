'use client'

interface PlanCTAProps {
    planName: string
}

export function PlanCTA({ planName }: PlanCTAProps) {
    const isFree = planName.toLowerCase() !== 'pro'

    if (isFree) {
        return (
            <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm text-center space-y-4">
                <div>
                    <h3 className="text-lg font-semibold mb-1">
                        Llevá tu legado al siguiente nivel
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Con Pro tenés video, más contactos de confianza, mensajes sellados y soporte prioritario.
                    </p>
                </div>

                {/* TODO: conectar con Stripe checkout en el próximo paso */}
                <button
                    onClick={() => {/* TODO: Stripe checkout */ }}
                    className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm"
                >
                    Pasar a Pro
                </button>

                <p className="text-xs text-muted-foreground">
                    Cancelás cuando quieras. Sin permanencia.
                </p>
            </div>
        )
    }

    return (
        <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm text-center space-y-4">
            <div>
                <h3 className="text-lg font-semibold mb-1">
                    ✨ Estás en el plan Pro
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Gracias por confiar en VoiceForLater. Tenés acceso completo a todas las funcionalidades.
                </p>
            </div>

            {/* TODO: conectar con Stripe portal en el próximo paso */}
            <button
                onClick={() => {/* TODO: Stripe portal */ }}
                className="inline-flex items-center justify-center px-6 py-2.5 border border-border text-foreground font-medium rounded-lg hover:bg-muted/50 transition-colors text-sm"
            >
                Administrar suscripción
            </button>
        </div>
    )
}
