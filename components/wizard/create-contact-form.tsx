'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid' // En caso de necesitar ID temporal, aunque idealmente el backend responde

interface CreateContactFormProps {
    onCancel: () => void
    onSuccess: (newContact: { id: string, name: string, email: string }) => void
}

export function CreateContactForm({ onCancel, onSuccess }: CreateContactFormProps) {
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
                throw new Error(data.error || 'Error creating contact')
            }

            // Asumimos que la API devuelve el contacto creado
            onSuccess(data)
        } catch (err: any) {
            setError(err.message || 'Error al guardar el contacto')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-secondary/10 space-y-3 animate-in fade-in zoom-in-95">
            <h4 className="font-medium text-sm">Nuevo Contacto de Confianza</h4>
            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="space-y-1">
                <label className="text-xs font-medium">Nombre</label>
                <input
                    required
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md"
                    placeholder="Ej: Juan Pérez"
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium">Email</label>
                <input
                    required
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md"
                    placeholder="juan@email.com"
                />
            </div>

            <div className="flex gap-2 justify-end pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-1.5 text-xs font-medium hover:bg-secondary/50 rounded"
                    disabled={loading}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Guardando...' : 'Guardar Contacto'}
                </button>
            </div>
        </form>
    )
}
