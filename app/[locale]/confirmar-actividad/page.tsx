'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConfirmActivityPage() {
    const router = useRouter()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

    useEffect(() => {
        async function confirm() {
            try {
                const res = await fetch('/api/checkin/confirm', { method: 'POST' })
                if (res.ok) {
                    setStatus('success')
                    // Small delay to show success state if needed, then redirect
                    setTimeout(() => {
                        router.push('/dashboard')
                    }, 1500)
                } else {
                    setStatus('error')
                    setTimeout(() => router.push('/dashboard'), 3000)
                }
            } catch (err) {
                console.error('Confirmation error:', err)
                setStatus('error')
                setTimeout(() => router.push('/dashboard'), 3000)
            }
        }

        confirm()
    }, [router])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F0EBE3] font-serif">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-[#E0D8CC] text-center">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-[#C4623A] mb-2">Carry My Words</h1>
                    <p className="text-sm text-[#8a6a50] italic">Mensajes que viajan en el tiempo</p>
                </div>

                {status === 'loading' && (
                    <div className="space-y-4">
                        <div className="animate-spin w-12 h-12 border-4 border-[#C4623A] border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-[#3a2e24]">Confirmando tu actividad...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl">✓</div>
                        <p className="text-[#3a2e24] font-medium">¡Identidad confirmada!</p>
                        <p className="text-sm text-gray-500">Tus mensajes siguen protegidos. Redirigiendo al panel...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl">!</div>
                        <p className="text-[#3a2e24]">Hubo un problema al confirmar.</p>
                        <p className="text-sm text-gray-500">Pero no te preocupes, vamos al panel para que lo hagas manualmente.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
