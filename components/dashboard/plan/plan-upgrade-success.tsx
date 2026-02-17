'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface PlanUpgradeSuccessProps {
    currentPlan: string // 'Free' or 'Pro'
    locale: string
}

export function PlanUpgradeSuccess({ currentPlan, locale }: PlanUpgradeSuccessProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const isSuccess = searchParams.get('upgrade') === 'success'
    const [status, setStatus] = useState<'checking' | 'success' | 'timeout'>(
        currentPlan.toLowerCase() === 'pro' ? 'success' : 'checking'
    )

    useEffect(() => {
        if (!isSuccess) return

        // If already Pro, just show success and cleanup
        if (currentPlan.toLowerCase() === 'pro') {
            setStatus('success')
            // Remove query param after delay
            const timer = setTimeout(() => {
                router.replace(`/${locale}/dashboard/plan`, { scroll: false })
            }, 3000)
            return () => clearTimeout(timer)
        }

        // If still Free, poll via refresh
        setStatus('checking')

        const timers: NodeJS.Timeout[] = []

        // Strategy: Refresh at 2s, 5s, 9s
        const strat = [2000, 5000, 9000]

        strat.forEach((delay) => {
            timers.push(setTimeout(() => {
                // Only refresh if still not pro (this effect re-runs if prop changes, so safe)
                router.refresh()
            }, delay))
        })

        // Timeout fallback after 12s
        timers.push(setTimeout(() => {
            setStatus('timeout')
        }, 12000))

        return () => timers.forEach(clearTimeout)

    }, [isSuccess, currentPlan, router, locale])

    if (!isSuccess) return null

    return (
        <div className={`
            mb-6 p-4 rounded-lg border text-sm animate-in fade-in slide-in-from-top-2 duration-300
            ${status === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                status === 'timeout' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                    'bg-blue-50 border-blue-200 text-blue-800'}
        `}>
            <div className="flex items-center gap-3">
                {status === 'checking' && (
                    <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <p>
                            <strong>Pago recibido.</strong> Confirmando actualización de plan... ({currentPlan})
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        <p>
                            <strong>¡Listo!</strong> Ya sos Pro. Disfrutá de todas las funcionalidades.
                        </p>
                    </>
                )}

                {status === 'timeout' && (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>
                        <p>
                            El pago fue procesado pero el plan aún figura como <strong>{currentPlan}</strong>.
                            Por favor esperá unos segundos y refrescá la página manualmente.
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}
