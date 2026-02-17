'use client'

import { useState, useMemo } from 'react'
import { COUNTRIES } from '@/lib/countries'
import { CALLING_CODES, parsePhone } from '@/lib/callingCodes'

interface ProfileData {
    first_name: string
    last_name: string
    email: string
    country: string
    city: string
    phone: string
}

interface ProfileFormProps {
    initialData: ProfileData
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const [form, setForm] = useState<ProfileData>(initialData)
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    // Parse phone into dial code + local number
    const parsedPhone = useMemo(() => parsePhone(initialData.phone), [initialData.phone])
    const [dialCode, setDialCode] = useState(parsedPhone.dialCode)
    const [localNumber, setLocalNumber] = useState(parsedPhone.localNumber)

    function handleChange(field: keyof ProfileData, value: string) {
        setForm(prev => ({ ...prev, [field]: value }))
        if (message) setMessage(null)
    }

    function handleLocalNumberChange(value: string) {
        // Allow only digits and spaces
        const cleaned = value.replace(/[^\d\s]/g, '')
        setLocalNumber(cleaned)
        if (message) setMessage(null)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setMessage(null)

        // Validate country
        if (!form.country.trim()) {
            setMessage({ type: 'error', text: 'El país es obligatorio.' })
            return
        }

        // Build phone string for storage
        const trimmedNumber = localNumber.replace(/\s+/g, ' ').trim()
        const phoneToSave = trimmedNumber ? `${dialCode} ${trimmedNumber}` : ''

        setIsSaving(true)

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ ...form, phone: phoneToSave }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Error al guardar')
            }

            let successText = 'Perfil guardado correctamente.'
            if (data.emailConfirmationRequired) {
                successText += ' Se envió un correo de confirmación a tu nueva dirección de email.'
            }

            setMessage({ type: 'success', text: successText })
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setMessage({ type: 'error', text: err.message || 'Error al guardar el perfil.' })
        } finally {
            setIsSaving(false)
        }
    }

    // TODO: i18n — replace hardcoded ES strings with dictionary keys
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Status message */}
            {message && (
                <div
                    className={`p-4 rounded-lg text-sm border ${message.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                            : 'bg-red-50 text-red-600 border-red-100'
                        }`}
                >
                    {message.text}
                </div>
            )}

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
                <h2 className="text-lg font-semibold mb-1">Datos personales</h2>

                {/* Name row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5" htmlFor="first_name">
                            Nombre
                        </label>
                        <input
                            id="first_name"
                            type="text"
                            value={form.first_name}
                            onChange={e => handleChange('first_name', e.target.value)}
                            placeholder="Tu nombre"
                            className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5" htmlFor="last_name">
                            Apellido
                        </label>
                        <input
                            id="last_name"
                            type="text"
                            value={form.last_name}
                            onChange={e => handleChange('last_name', e.target.value)}
                            placeholder="Tu apellido"
                            className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                        />
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium mb-1.5" htmlFor="email">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={e => handleChange('email', e.target.value)}
                        placeholder="tu@email.com"
                        required
                        className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                    />
                    {form.email !== initialData.email && (
                        <p className="text-xs text-amber-600 mt-1">
                            Al cambiar tu email, recibirás un correo de confirmación en la nueva dirección.
                        </p>
                    )}
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
                <h2 className="text-lg font-semibold mb-1">Ubicación y contacto</h2>

                {/* Country (dropdown) + City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5" htmlFor="country">
                            País <span className="text-red-400">*</span>
                        </label>
                        <select
                            id="country"
                            value={form.country}
                            onChange={e => handleChange('country', e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all appearance-none"
                        >
                            <option value="">Seleccionar país</option>
                            {COUNTRIES.map(c => (
                                <option key={c.code} value={c.name}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5" htmlFor="city">
                            Ciudad <span className="text-muted-foreground text-xs">(opcional)</span>
                        </label>
                        <input
                            id="city"
                            type="text"
                            value={form.city}
                            onChange={e => handleChange('city', e.target.value)}
                            placeholder="Ej: Buenos Aires"
                            className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                        />
                    </div>
                </div>

                {/* Phone: dial code select + local number input */}
                <div>
                    <label className="block text-sm font-medium mb-1.5">
                        Teléfono <span className="text-muted-foreground text-xs">(opcional)</span>
                    </label>
                    <div className="grid grid-cols-[130px_1fr] sm:grid-cols-[140px_1fr] gap-2">
                        <select
                            id="phone_dial"
                            value={dialCode}
                            onChange={e => { setDialCode(e.target.value); if (message) setMessage(null) }}
                            className="w-full px-2 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm appearance-none"
                        >
                            {CALLING_CODES.map(c => (
                                <option key={c.iso} value={c.dial}>
                                    {c.dial} {c.country}
                                </option>
                            ))}
                        </select>
                        <input
                            id="phone_number"
                            type="tel"
                            value={localNumber}
                            onChange={e => handleLocalNumberChange(e.target.value)}
                            placeholder="Ej: 99 123 456"
                            className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm min-w-[140px]"
                >
                    {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </button>
            </div>
        </form>
    )
}
