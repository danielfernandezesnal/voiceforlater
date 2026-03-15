'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Contact {
    id: string
    name: string
    email: string
}

interface TrustedContactListProps {
    dictionary: any
    locale: string
    plan: string
    initialContacts: Contact[]
    userEmail: string
}

export function TrustedContactList({ dictionary, locale, plan, initialContacts, userEmail }: TrustedContactListProps) {
    const [contacts, setContacts] = useState<Contact[]>(initialContacts)

    // Sync state with props when router.refresh() is called
    useEffect(() => {
        setContacts(initialContacts);
    }, [initialContacts]);

    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isAddingMode, setIsAddingMode] = useState(false)

    // Form State
    const [newName, setNewName] = useState('')
    const [newEmail, setNewEmail] = useState('')

    const router = useRouter()

    // Plan-aware limits
    const maxContacts = plan === 'pro' ? 3 : 1
    const canAdd = contacts.length < maxContacts

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        setIsSaving(true)
        setError(null)

        if (newEmail.trim().toLowerCase() === userEmail.toLowerCase()) {
            setError(dictionary.trustedContact.ownEmailError)
            setIsSaving(false)
            return
        }

        try {
            const res = await fetch('/api/trusted-contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name: newName, email: newEmail, locale })
            })

            const data = await res.json()

            if (!res.ok) {
                if (res.status === 403 && data.limitReached) {
                    throw new Error(data.error)
                }
                if (res.status === 409) {
                    throw new Error(dictionary.trustedContact.duplicateError || 'Ese contacto ya existe.')
                }
                throw new Error(data.error || 'Failed to add contact')
            }

            // Success — refresh the page to get fresh server-side data
            setNewName('')
            setNewEmail('')
            setIsAddingMode(false)
            router.refresh()
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.message || 'Error occurred')
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm(dictionary.trustedContact.deleteConfirm || 'Are you sure?')) return

        setIsDeleting(id)
        try {
            const res = await fetch(`/api/trusted-contacts?id=${id}`, {
                method: 'DELETE',
                credentials: 'include',
            })

            if (res.status === 409) {
                const data = await res.json()
                alert(data.error)
                return
            }

            if (!res.ok) throw new Error('Failed to delete')

            // Refresh to get fresh server-side data
            router.refresh()
        } catch {
            alert('Error al eliminar contacto')
        } finally {
            setIsDeleting(null)
        }
    }

    return (
        <div className="space-y-8">
            {/* Header / Add Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="font-serif font-semibold text-lg text-foreground mb-4">{dictionary.trustedContact.title}</h2>
                    {dictionary.trustedContact.sectionSubtitle && (
                        <p className="text-muted-foreground text-sm mt-1">{dictionary.trustedContact.sectionSubtitle}</p>
                    )}
                </div>

                {!isAddingMode && (
                    <div className="flex flex-col items-end gap-1.5">
                        <button
                            onClick={() => setIsAddingMode(true)}
                            disabled={!canAdd}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${canAdd
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                                }`}
                        >
                            {dictionary.trustedContact.addContact}
                        </button>
                        {!canAdd && plan === 'free' && (
                            <span className="text-xs text-amber-600">
                                Límite del plan Free (1). Pasate a Pro para agregar hasta 3.
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                    {error}
                </div>
            )}

            {/* Add Form */}
            {isAddingMode && (
                <div className="bg-card border border-border p-6 rounded-xl shadow-sm animate-in slide-in-from-top-2">
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{dictionary.trustedContact.nameLabel}</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder={dictionary.trustedContact.namePlaceholder}
                                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{dictionary.trustedContact.emailLabel}</label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder={dictionary.trustedContact.emailPlaceholder}
                                    required
                                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsAddingMode(false)}
                                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                            >
                                {dictionary.common?.cancel || 'Cancelar'}
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 min-w-[100px]"
                            >
                                {isSaving ? (dictionary.trustedContact.saving || 'Guardando...') : (dictionary.trustedContact.save)}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="grid gap-4 w-full max-w-full box-border px-0 sm:px-0">
                {contacts.length === 0 && !isAddingMode ? (
                    <div className="text-center py-12 bg-card/50 border border-border border-dashed rounded-xl">
                        <p className="text-muted-foreground">{dictionary.trustedContact.noContact}</p>
                        <button
                            onClick={() => setIsAddingMode(true)}
                            className="mt-4 text-primary font-medium hover:underline"
                        >
                            {dictionary.trustedContact.addContact}
                        </button>
                    </div>
                ) : (
                    contacts.map(contact => (
                        <div key={contact.id} className="flex items-center justify-between p-3 sm:p-4 bg-card border border-border rounded-lg shadow-sm hover:border-primary/20 transition-colors w-full box-border overflow-hidden">
                            <div className="flex items-center gap-3 sm:gap-4 overflow-hidden w-full min-w-0">
                                <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold border border-primary/10" style={{ backgroundColor: 'rgba(196,98,58,0.12)', color: '#C4623A' }}>
                                    {contact.name ? contact.name[0].toUpperCase() : contact.email[0].toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1 overflow-hidden pr-2">
                                    <h4 className="font-medium text-foreground truncate block w-full">{contact.name || 'Sin nombre'}</h4>
                                    <p className="text-xs sm:text-sm text-muted-foreground truncate block w-full">{contact.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(contact.id)}
                                disabled={isDeleting === contact.id}
                                className="shrink-0 p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-1"
                                title={dictionary.trustedContact.remove}
                            >
                                {isDeleting === contact.id ? (
                                    <span className="w-4 h-4 block animate-spin border-2 border-red-500 border-t-transparent rounded-full"></span>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Info Note — How it works */}
            <div className="rounded-xl p-4 mt-2 text-sm leading-relaxed"
                style={{ background: 'rgba(196,98,58,0.07)', border: '1px solid rgba(196,98,58,0.18)' }}>
                <p style={{ color: '#C4623A' }} className="font-medium mb-1">
                    {dictionary.trustedContact.howItWorks.title}
                </p>
                <ul className="space-y-1 text-muted-foreground">
                    <li>· {dictionary.trustedContact.howItWorks.item1}</li>
                    <li>· {dictionary.trustedContact.howItWorks.item2}</li>
                    <li>· {dictionary.trustedContact.howItWorks.item3}</li>
                </ul>
            </div>
        </div>
    )
}
