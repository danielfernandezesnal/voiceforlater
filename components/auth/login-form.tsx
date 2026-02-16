'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ADMIN_EMAIL } from "@/lib/constants";

interface LoginFormProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dictionary: any // Using any for flexibilty with deeply nested structure, or define strict type
    locale: string
}

type Mode = 'login' | 'magic' | 'reset'

export function LoginForm({ dictionary, locale }: LoginFormProps) {
    const [mode, setMode] = useState<Mode>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    // Handlers
    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) {
                if (signInError.message.includes('Invalid login credentials')) {
                    setError(dictionary.error || 'Credenciales inválidas')
                } else {
                    setError(signInError.message)
                }
            } else {
                // Success - Redirect based on role
                router.refresh()
                if (email.toLowerCase() === ADMIN_EMAIL) {
                    router.push(`/${locale}/admin`)
                } else {
                    router.push(`/${locale}/dashboard`)
                }
            }
        } catch {
            setError('Error de conexión')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleMagicLink(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccessMessage(null)

        try {
            const response = await fetch('/api/auth/magic-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, locale }),
            })

            const data = await response.json()

            if (!response.ok || data.error) {
                setError(dictionary.magicLink.error)
            } else {
                setSuccessMessage(dictionary.magicLink.success.message.replace('{email}', email))
            }
        } catch {
            setError(dictionary.magicLink.error)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleResetPassword(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccessMessage(null)

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, locale }),
            })

            // Check status but assuming success message always for security
            if (response.ok) {
                setSuccessMessage(dictionary.resetPassword?.success || 'Te enviamos una nueva contraseña a tu email.')
            } else {
                // Even on error, show generic success or specific if needed
                setSuccessMessage(dictionary.resetPassword?.success || 'Te enviamos una nueva contraseña a tu email.')
            }
        } catch {
            setError('Error al solicitar restablecimiento')
        } finally {
            setIsLoading(false)
        }
    }

    // Render Logic

    // Header
    const getTitle = () => {
        if (mode === 'magic') return dictionary.magicLink.title
        if (mode === 'reset') return dictionary.resetPassword?.title || 'Restablecer contraseña'
        return dictionary.login
    }

    const getSubtitle = () => {
        if (mode === 'magic') return dictionary.magicLink.subtitle
        if (mode === 'reset') return dictionary.resetPassword?.subtitle || 'Ingresa tu email'
        return 'Ingresa tus credenciales'
    }

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold">{getTitle()}</h1>
                <p className="mt-2 text-muted-foreground">{getSubtitle()}</p>
            </div>

            {/* Success Message */}
            {successMessage ? (
                <div className="text-center p-6 bg-card rounded-xl border border-border">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-2xl">✉️</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Revisa tu email</h3>
                    <p className="text-muted-foreground">{successMessage}</p>
                    <button
                        onClick={() => { setSuccessMessage(null); setMode('login'); }}
                        className="mt-6 text-primary hover:underline text-sm"
                    >
                        Volver al inicio de sesión
                    </button>
                </div>
            ) : (
                /* Forms */
                <>
                    {/* LOGIN FORM */}
                    {mode === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{dictionary.emailLabel}</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={dictionary.magicLink.emailPlaceholder}
                                    required
                                    className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{dictionary.passwordLabel || 'Contraseña'}</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            {error && <div className="text-red-500 text-sm">{error}</div>}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isLoading ? dictionary.magicLink.sending : dictionary.submit}
                            </button>

                            <div className="flex flex-col gap-3 mt-4 text-center text-sm">
                                <button type="button" onClick={() => setMode('magic')} className="text-primary hover:underline">
                                    {dictionary.createAccount || 'Nueva cuenta / Sin contraseña'}
                                </button>
                                <button type="button" onClick={() => setMode('reset')} className="text-muted-foreground hover:text-primary">
                                    {dictionary.forgotPassword || 'Olvidé mi contraseña'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* MAGIC LINK FORM (REGISTER/NO PASS) */}
                    {mode === 'magic' && (
                        <form onSubmit={handleMagicLink} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{dictionary.magicLink.emailLabel}</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={dictionary.magicLink.emailPlaceholder}
                                    required
                                    className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            {error && <div className="text-red-500 text-sm">{error}</div>}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isLoading ? dictionary.magicLink.sending : dictionary.magicLink.submit}
                            </button>

                            <div className="text-center mt-4">
                                <button type="button" onClick={() => setMode('login')} className="text-sm text-primary hover:underline">
                                    Volver a Iniciar Sesión
                                </button>
                            </div>
                        </form>
                    )}

                    {/* RESET PASSWORD FORM */}
                    {mode === 'reset' && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{dictionary.emailLabel}</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={dictionary.magicLink.emailPlaceholder}
                                    required
                                    className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            {error && <div className="text-red-500 text-sm">{error}</div>}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isLoading ? 'Enviando...' : (dictionary.resetPassword?.submit || 'Resetear contraseña')}
                            </button>

                            <div className="text-center mt-4">
                                <button type="button" onClick={() => setMode('login')} className="text-sm text-primary hover:underline">
                                    Volver a Iniciar Sesión
                                </button>
                            </div>
                        </form>
                    )}
                </>
            )}
        </div>
    )
}
