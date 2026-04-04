'use client'

import { useState } from 'react'

interface PlanCTAProps {
    planName: string
    locale: string
}

export function PlanCTA({ planName, locale }: PlanCTAProps) {
    const isFree = planName.toLowerCase() !== 'pro'
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showCancelModal, setShowCancelModal] = useState(false)

    async function handleUpgrade() {
        setIsLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ redirectPath: `/${locale}/dashboard/plan?upgrade=success` }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Error al iniciar checkout')
            if (data.url) {
                window.location.href = data.url
            }
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.message || 'No se pudo iniciar el checkout.')
            setIsLoading(false)
        }
    }

    async function handleManage() {
        setIsLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/stripe/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ returnUrl: `/${locale}/dashboard/plan` }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Error al abrir portal')
            if (data.url) {
                window.location.href = data.url
            }
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.message || 'No se pudo abrir el portal.')
            setIsLoading(false)
        }
    }

    if (isFree) {
        return (
            <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm text-center space-y-4">
                <div>
                    <h3 className="text-lg font-semibold mb-1">
                        Llevá tu legado al siguiente nivel
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Con Pro tenés video, más contactos de confianza y mensajes sellados.
                    </p>
                </div>

                {error && (
                    <p className="text-sm text-red-600">{error}</p>
                )}

                <button
                    onClick={handleUpgrade}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-wait"
                >
                    {isLoading ? 'Abriendo pago...' : 'Pasar a Pro'}
                </button>

                <p className="text-xs text-muted-foreground">
                    Cancelás cuando quieras. Sin permanencia.
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm text-center space-y-4">
                <div>
                    <h3 className="font-serif font-light text-2xl mb-1">
                        Estás en el plan Pro
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Tenés acceso completo a todas las funcionalidades.
                    </p>
                </div>

                {error && (
                    <p className="text-sm text-red-600">{error}</p>
                )}

                <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center px-6 py-2.5 border border-border text-muted-foreground font-medium rounded-lg hover:bg-muted/50 transition-colors text-sm disabled:opacity-50 disabled:cursor-wait"
                >
                    Cancelar suscripción
                </button>
            </div>

            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
                        <h3 className="font-serif font-light text-xl text-foreground">
                            ¿Cancelar suscripción?
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Perderás acceso a video, contactos adicionales y mensajes sellados al finalizar el período actual.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm"
                            >
                                Mantener Pro
                            </button>
                            <button
                                onClick={() => { setShowCancelModal(false); handleManage(); }}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2.5 border border-border text-muted-foreground font-medium rounded-lg hover:bg-muted/50 transition-colors text-sm disabled:opacity-50"
                            >
                                {isLoading ? 'Abriendo portal...' : 'Sí, cancelar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
