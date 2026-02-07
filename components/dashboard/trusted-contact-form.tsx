'use client'

import { useState, useEffect } from 'react'

interface TrustedContactFormProps {
    dictionary: {
        title: string
        description: string
        nameLabel: string
        namePlaceholder: string
        emailLabel: string
        emailPlaceholder: string
        confirmEmailLabel: string
        confirmEmailPlaceholder: string
        emailMismatch: string
        save: string
        saving: string
        saved: string
        remove: string
        addContact: string
        noContact: string
    }
}

interface TrustedContact {
    id: string
    name: string
    email: string
}

export function TrustedContactForm({ dictionary }: TrustedContactFormProps) {
    const [contact, setContact] = useState<TrustedContact | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [confirmEmail, setConfirmEmail] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [justSaved, setJustSaved] = useState(false)

    useEffect(() => {
        fetchContact()
    }, [])

    const fetchContact = async () => {
        try {
            const res = await fetch('/api/trusted-contact')
            const data = await res.json()
            if (data.contact) {
                setContact(data.contact)
                setName(data.contact.name)
                setEmail(data.contact.email)
            }
        } catch (error) {
            console.error('Error fetching trusted contact:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        if (!name || !email || !confirmEmail || email !== confirmEmail) return

        setIsSaving(true)
        try {
            const res = await fetch('/api/trusted-contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email }),
            })

            if (res.ok) {
                const data = await res.json()
                setContact(data.contact)
                setIsEditing(false)
                setConfirmEmail('')
                setJustSaved(true)
                setTimeout(() => setJustSaved(false), 3000)
            }
        } catch (error) {
            console.error('Error saving trusted contact:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleRemove = async () => {
        if (!confirm('Are you sure you want to remove your trusted contact?')) return

        try {
            const res = await fetch('/api/trusted-contact', { method: 'DELETE' })
            if (res.ok) {
                setContact(null)
                setName('')
                setEmail('')
                setConfirmEmail('')
                setIsEditing(false)
            }
        } catch (error) {
            console.error('Error removing trusted contact:', error)
        }
    }

    if (isLoading) {
        return (
            <div className="p-4 bg-card border border-border rounded-xl animate-pulse">
                <div className="h-4 bg-secondary rounded w-1/2 mb-2" />
                <div className="h-4 bg-secondary rounded w-2/3" />
            </div>
        )
    }

    // Display mode (has contact and not editing)
    if (contact && !isEditing) {
        return (
            <div className={`p-4 bg-card border rounded-xl ${justSaved ? 'border-success/30' : 'border-border'}`}>
                <h3 className="font-medium flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {dictionary.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-3">{dictionary.description}</p>

                <div className="flex items-center justify-between bg-secondary/50 p-3 rounded-lg">
                    <div>
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-sm text-muted-foreground">{contact.email}</div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-primary hover:text-primary/80 text-sm"
                        >
                            Edit
                        </button>
                        <button
                            onClick={handleRemove}
                            className="text-error hover:text-error/80 text-sm"
                        >
                            {dictionary.remove}
                        </button>
                    </div>
                </div>

                {justSaved && (
                    <p className="text-success text-sm mt-2">{dictionary.saved}</p>
                )}
            </div>
        )
    }

    // No contact or editing mode
    return (
        <div className="p-4 bg-card border border-border rounded-xl">
            <h3 className="font-medium flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {dictionary.title}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">{dictionary.description}</p>

            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium mb-1">{dictionary.nameLabel}</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={dictionary.namePlaceholder}
                        className="w-full px-3 py-2 bg-input border border-border rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{dictionary.emailLabel}</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={dictionary.emailPlaceholder}
                        className="w-full px-3 py-2 bg-input border border-border rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{dictionary.confirmEmailLabel}</label>
                    <input
                        type="email"
                        value={confirmEmail}
                        onChange={(e) => setConfirmEmail(e.target.value)}
                        placeholder={dictionary.confirmEmailPlaceholder}
                        className={`w-full px-3 py-2 bg-input border rounded-lg ${confirmEmail && email !== confirmEmail
                                ? 'border-error focus:border-error focus:ring-error'
                                : 'border-border'
                            }`}
                    />
                    {confirmEmail && email !== confirmEmail && (
                        <p className="text-error text-sm mt-1">{dictionary.emailMismatch}</p>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !name || !email || !confirmEmail || email !== confirmEmail}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                        {isSaving ? dictionary.saving : dictionary.save}
                    </button>
                    {isEditing && (
                        <button
                            onClick={() => {
                                setIsEditing(false)
                                setName(contact?.name || '')
                                setEmail(contact?.email || '')
                                setConfirmEmail('')
                            }}
                            className="px-4 py-2 text-muted-foreground hover:text-foreground text-sm"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
