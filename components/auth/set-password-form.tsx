'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SetPasswordFormProps {
    dictionary: any
    locale: string
}

export function SetPasswordForm({ dictionary, locale }: SetPasswordFormProps) {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.') // Use dict if available
            setIsLoading(false)
            return
        }

        // Alphanumeric check optional but recommended per requirement
        // /^[a-zA-Z0-9]+$/ strict? Or contains both?
        // Requirement: "alfanumérica de mínimo 6 caracteres" logic usually means letters AND numbers?
        // Or just that it allows alphanumeric chars? Usually implies complexity.
        // Let's implement basic alphanumeric check if requested.
        // "Implementar: /^[a-zA-Z0-9]{6,}$/." <- This means ONLY alphanumeric chars allowed.
        if (!/^[a-zA-Z0-9]{6,}$/.test(password)) {
            setError('La contraseña debe contener solo letras y números (mínimo 6).')
            setIsLoading(false)
            return
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.')
            setIsLoading(false)
            return
        }

        try {
            // 1. Update Auth User Password
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            })

            if (updateError) throw updateError

            // 2. Update Profile Flag
            // We need current user ID
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ auth_password_set: true })
                    .eq('id', user.id)

                if (profileError) {
                    console.error('Profile update failed:', profileError)
                    // Continue anyway, auth worked.
                }
            }

            // 3. Redirect
            router.refresh()
            router.push(`/${locale}/dashboard`)

        } catch (err: any) {
            setError(err.message || 'Error al actualizar contraseña')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md w-full mx-auto p-6 bg-card rounded-xl border border-border shadow-lg">
            <div className="text-center mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold">{dictionary.setPassword.title}</h2>
                <p className="text-muted-foreground mt-2">{dictionary.setPassword.subtitle}</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">{dictionary.setPassword.label}</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Confirmar contraseña</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 shadow-md"
            >
                {isLoading ? 'Guardando...' : dictionary.setPassword.submit}
            </button>
        </form>
    )
}
