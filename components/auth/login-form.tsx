'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ADMIN_EMAIL } from "@/lib/constants";

interface LoginFormProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dictionary: any // Using any for flexibilty with deeply nested structure, or define strict type
    locale: string
    next?: string | null
}

type Mode = 'login' | 'magic' | 'reset'

export function LoginForm({ dictionary, locale, next }: LoginFormProps) {
    const [mode, setMode] = useState<Mode>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
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
                // Success - Redirect based on role, or post-delivery-token next
                router.refresh()
                if (email.toLowerCase() === ADMIN_EMAIL) {
                    router.push(`/${locale}/admin`)
                } else if (next) {
                    router.push(next)
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
                body: JSON.stringify({ email, locale, next }),
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
                <h1 className="text-2xl font-serif font-bold">{getTitle()}</h1>
                <p className="mt-2 text-muted-foreground">{getSubtitle()}</p>
            </div>

            {/* Success Message */}
            {successMessage ? (
                <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-2xl">✉️</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">
                        {locale === 'es' ? 'Revisá tu email' : 'Check your email'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        {locale === 'es' ? 'Enviamos un enlace a:' : 'We sent a link to:'}
                    </p>
                    <div className="bg-muted rounded-lg px-4 py-2.5 mb-4">
                        <p className="text-sm font-medium break-all text-foreground">{email}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {locale === 'es' ? 'Hacé clic en el enlace para iniciar sesión.' : 'Click the link to sign in.'}
                    </p>
                    <button
                        onClick={() => { setSuccessMessage(null); setMode('login'); }}
                        className="mt-6 text-primary hover:underline text-sm"
                    >
                        {locale === 'es' ? 'Volver al inicio de sesión' : 'Back to sign in'}
                    </button>
                </div>
            ) : (
                /* Forms */
                <>
                    {/* Google Login Button */}
                    <button
                        onClick={async () => {
                            try {
                                const { error } = await supabase.auth.signInWithOAuth({
                                    provider: 'google',
                                    options: {
                                        redirectTo: `${window.location.origin}/auth/callback?redirect_to=/${locale}/${next ? encodeURIComponent(next) : 'dashboard'}`,
                                        queryParams: {
                                            access_type: 'offline',
                                            prompt: 'consent',
                                        }
                                    }
                                });
                                if (error) setError(error.message);
                            } catch (err) {
                                setError('Error de conexión con Google');
                            }
                        }}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-full hover:bg-muted/50 transition-colors"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {dictionary.continueWithGoogle}
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-card text-muted-foreground">
                                {dictionary.orContinueWithEmail}
                            </span>
                        </div>
                    </div>
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
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full px-4 py-3 pr-12 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                                <line x1="1" y1="1" x2="23" y2="23"/>
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                <circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        )}
                                    </button>
                                </div>
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
