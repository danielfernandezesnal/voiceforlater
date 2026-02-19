'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid' // En caso de necesitar ID temporal, aunque idealmente el backend responde

interface CreateContactFormProps {
    dictionary: {
        newContactTitle: string
        nameLabel: string
        namePlaceholder: string
        emailLabel: string
        emailPlaceholder: string
        cancel: string
        save: string
        saving: string
        errorCreating: string
    }
    onCancel: () => void
    onSuccess: (newContact: { id: string, name: string, email: string }) => void
}

export function CreateContactForm({ dictionary, onCancel, onSuccess }: CreateContactFormProps) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/trusted-contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || dictionary.errorCreating)
            }

            onSuccess(data)
        } catch (err: any) {
            setError(err.message || dictionary.errorCreating)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-secondary/10 space-y-3 animate-in fade-in zoom-in-95">
            <h4 className="font-medium text-sm">{dictionary.newContactTitle}</h4>
            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="space-y-1">
                <label className="text-xs font-medium">{dictionary.nameLabel}</label>
                <input
                    required
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md"
                    placeholder={dictionary.namePlaceholder}
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium">{dictionary.emailLabel}</label>
                <input
                    required
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md"
                    placeholder={dictionary.emailPlaceholder}
                />
            </div>

            <div className="flex gap-2 justify-end pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-1.5 text-xs font-medium hover:bg-secondary/50 rounded"
                    disabled={loading}
                >
                    {dictionary.cancel}
                </button>
                <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? dictionary.saving : dictionary.save}
                </button>
            </div>
        </form>
    )
}
