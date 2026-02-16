'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Contact {
    id: string
    name: string
    email: string
}

interface TrustedContactListProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dictionary: any
    locale: string
}

export function TrustedContactList({ dictionary, locale }: TrustedContactListProps) {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isAddingMode, setIsAddingMode] = useState(false)

    // Form State
    const [newName, setNewName] = useState('')
    const [newEmail, setNewEmail] = useState('')

    const router = useRouter()

    useEffect(() => {
        fetchContacts()
    }, [])

    async function fetchContacts() {
        try {
            const res = await fetch('/api/trusted-contacts')
            if (!res.ok) throw new Error('Failed to load contacts')
            const data = await res.json()
            setContacts(data)
        } catch (err) {
            console.error(err)
            setError('Error loading contacts')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        setIsSaving(true)
        setError(null)

        try {
            const res = await fetch('/api/trusted-contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, email: newEmail, locale })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to add contact')
            }

            // Success
            setContacts([data, ...contacts])
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
        if (!confirm('Are you sure?')) return

        setIsDeleting(id)
        try {
            const res = await fetch(`/api/trusted-contacts?id=${id}`, {
                method: 'DELETE'
            })

            if (!res.ok) throw new Error('Failed to delete')

            setContacts(contacts.filter(c => c.id !== id))
            router.refresh()
        } catch {
            alert('Error deleting contact')
        } finally {
            setIsDeleting(null)
        }
    }

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">{dictionary.common?.loading || 'Cargando...'}</div>

    return (
        <div className="space-y-8">
            {/* Header / Add Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold">{dictionary.trustedContact.title}</h2>
                    <p className="text-muted-foreground text-sm mt-1">{dictionary.trustedContact.description}</p>
                </div>

                {!isAddingMode && contacts.length < 3 && (
                    <button
                        onClick={() => setIsAddingMode(true)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        {dictionary.trustedContact.addContact}
                    </button>
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
            <div className="grid gap-4">
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
                        <div key={contact.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg shadow-sm hover:border-primary/20 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {contact.name ? contact.name[0].toUpperCase() : contact.email[0].toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-medium text-foreground">{contact.name || 'Sin nombre'}</h4>
                                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(contact.id)}
                                disabled={isDeleting === contact.id}
                                className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

            {/* Info Note */}
            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                <p>
                    <strong>Nota:</strong> Puedes agregar hasta 3 contactos de confianza. Estos contactos formarán tu &quot;grupo de confianza&quot; y podrás asignar cualquiera de ellos a tus mensajes individuales más adelante.
                    Al agregar un contacto, le enviaremos un correo para notificarle.
                </p>
            </div>
        </div>
    )
}
