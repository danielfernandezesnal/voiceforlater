'use client'

import { useState } from 'react'


interface MagicLinkFormProps {
    dictionary: {
        emailLabel: string
        emailPlaceholder: string
        submit: string
        sending: string
        error: string
        success: {
            title: string
            message: string
        }
    }
    locale: string
}

export function MagicLinkForm({ dictionary, locale }: MagicLinkFormProps) {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)



    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/auth/magic-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, locale }),
            })

            const data = await response.json()

            if (!response.ok || data.error) {
                setError(dictionary.error)
            } else {
                setSuccess(true)
            }
        } catch {
            setError(dictionary.error)
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="text-center p-6 bg-card rounded-xl border border-border">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">{dictionary.success.title}</h3>
                <p className="text-muted-foreground">
                    {dictionary.success.message.replace('{email}', email)}
                </p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                    {dictionary.emailLabel}
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={dictionary.emailPlaceholder}
                    required
                    className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground"
                />
            </div>

            {error && (
                <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/25"
            >
                {isLoading ? dictionary.sending : dictionary.submit}
            </button>
        </form>
    )
}
