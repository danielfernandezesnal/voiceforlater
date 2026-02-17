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
                        Con Pro tenés video, más contactos de confianza, mensajes sellados y soporte prioritario.
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
        <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm text-center space-y-4">
            <div>
                <h3 className="text-lg font-semibold mb-1">
                    ✨ Estás en el plan Pro
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Gracias por confiar en VoiceForLater. Tenés acceso completo a todas las funcionalidades.
                </p>
            </div>

            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}

            <button
                onClick={handleManage}
                disabled={isLoading}
                className="inline-flex items-center justify-center px-6 py-2.5 border border-border text-foreground font-medium rounded-lg hover:bg-muted/50 transition-colors text-sm disabled:opacity-50 disabled:cursor-wait"
            >
                {isLoading ? 'Abriendo portal...' : 'Administrar suscripción'}
            </button>
        </div>
    )
}
