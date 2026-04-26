'use client'

import { useState } from 'react'

interface PlanCTAProps {
    planName: string
    locale: string
    proPrice?: string
    manageSub?: string
}

export function PlanCTA({ planName, locale, proPrice, manageSub }: PlanCTAProps) {
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
            <div
                style={{
                    background: '#fffdf9',
                    border: '1px solid #e8e0d0',
                    borderLeft: '3px solid #C4623A',
                    borderRadius: '4px',
                }}
                className="p-6 space-y-4"
            >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span style={{ fontSize: '10px', letterSpacing: '0.12em', color: '#C4623A', fontWeight: 600, textTransform: 'uppercase' }}>
                                Plan Pro
                            </span>
                            {proPrice && (
                                <span style={{ fontSize: '12px', color: '#7a5c3a', background: 'rgba(196,98,58,0.08)', padding: '2px 9px', borderRadius: '99px', border: '1px solid rgba(196,98,58,0.18)' }}>
                                    {proPrice}
                                </span>
                            )}
                        </div>
                        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: '#2A2018', fontWeight: 400, lineHeight: 1.3 }}>
                            Lleva tu legado al siguiente nivel
                        </h3>
                    </div>
                </div>

                <p style={{ fontSize: '13px', color: '#6B5040', lineHeight: 1.55 }}>
                    Con Pro tenés video, más contactos de confianza y mensajes sellados.
                </p>

                {error && (
                    <p className="text-sm text-red-600">{error}</p>
                )}

                <div>
                    <button
                        onClick={handleUpgrade}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center px-7 py-2.5 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-wait"
                        style={{ background: '#C4623A', color: '#fff', borderRadius: '4px' }}
                    >
                        {isLoading ? 'Abriendo pago...' : 'Pasar a Pro'}
                    </button>
                </div>

                <p style={{ fontSize: '11px', color: '#9a8070' }}>
                    Cancelás cuando quieras. Sin permanencia.
                </p>
            </div>
        )
    }

    return (
        <>
            <div
                style={{
                    background: '#fffdf9',
                    border: '1px solid #e8e0d0',
                    borderLeft: '3px solid #4a8c6a',
                    borderRadius: '4px',
                }}
                className="p-6 space-y-4"
            >
                <div>
                    <span style={{ fontSize: '10px', letterSpacing: '0.12em', color: '#4a8c6a', fontWeight: 600, textTransform: 'uppercase' }}>
                        Plan activo
                    </span>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: '#2A2018', fontWeight: 400, lineHeight: 1.3, marginTop: '5px' }}>
                        Estás en el plan Pro
                    </h3>
                    <p style={{ fontSize: '13px', color: '#6B5040', lineHeight: 1.55, marginTop: '4px' }}>
                        Tenés acceso completo a todas las funcionalidades.
                    </p>
                </div>

                {error && (
                    <p className="text-sm text-red-600">{error}</p>
                )}

                <div className="flex flex-col items-start gap-2">
                    <button
                        onClick={handleManage}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center px-6 py-2.5 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-wait"
                        style={{ background: 'rgba(74,140,106,0.1)', color: '#2e6b4a', border: '1px solid rgba(74,140,106,0.25)', borderRadius: '4px' }}
                    >
                        {isLoading ? 'Abriendo portal...' : (manageSub || 'Gestionar suscripción')}
                    </button>

                    <button
                        onClick={() => setShowCancelModal(true)}
                        disabled={isLoading}
                        className="text-xs hover:underline disabled:opacity-50"
                        style={{ color: '#9a8070' }}
                    >
                        Cancelar suscripción
                    </button>
                </div>
            </div>

            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
                        <h3 className="font-serif font-light text-xl text-foreground">
                            Antes de irte...
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Estás por cancelar tu suscripción. Los mensajes programados después del vencimiento de tu plan no se enviarán, pero quedarán guardados en tu dashboard.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm"
                            >
                                Seguir dejando huella en quienes amo
                            </button>
                            <button
                                onClick={() => { setShowCancelModal(false); handleManage(); }}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2.5 border border-border text-muted-foreground font-medium rounded-lg hover:bg-muted/50 transition-colors text-sm disabled:opacity-50"
                            >
                                {isLoading ? 'Abriendo portal...' : 'Confirmar cancelación'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
