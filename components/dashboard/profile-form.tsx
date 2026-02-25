'use client'

import { useState, useMemo } from 'react'
import { COUNTRIES } from '@/lib/countries'
import { CALLING_CODES, parsePhone } from '@/lib/callingCodes'
import type { Dictionary } from '@/lib/i18n'

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
    dictionary: Dictionary
}

export function ProfileForm({ initialData, dictionary }: ProfileFormProps) {
    const t = dictionary.profile.form
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
            setMessage({ type: 'error', text: t.errors.countryRequired })
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
                throw new Error(data.error || t.errors.saveFallback)
            }

            let successText = t.success.saved
            if (data.emailConfirmationRequired) {
                successText += t.success.emailConfirmation
            }

            setMessage({ type: 'success', text: successText })
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : t.errors.saveError
            setMessage({ type: 'error', text: msg || t.errors.saveError })
        } finally {
            setIsSaving(false)
        }
    }

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
                <h2 className="text-lg font-semibold mb-1">{t.personalData}</h2>

                {/* Name row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5" htmlFor="first_name">
                            {t.firstName}
                        </label>
                        <input
                            id="first_name"
                            type="text"
                            value={form.first_name}
                            onChange={e => handleChange('first_name', e.target.value)}
                            placeholder={t.firstNamePlaceholder}
                            className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5" htmlFor="last_name">
                            {t.lastName}
                        </label>
                        <input
                            id="last_name"
                            type="text"
                            value={form.last_name}
                            onChange={e => handleChange('last_name', e.target.value)}
                            placeholder={t.lastNamePlaceholder}
                            className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                        />
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium mb-1.5" htmlFor="email">
                        {t.email}
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={e => handleChange('email', e.target.value)}
                        placeholder={t.emailPlaceholder}
                        required
                        className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                    />
                    {form.email !== initialData.email && (
                        <p className="text-xs text-amber-600 mt-1">
                            {t.emailChangeNotice}
                        </p>
                    )}
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
                <h2 className="text-lg font-semibold mb-1">{t.locationContact}</h2>

                {/* Country (dropdown) + City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5" htmlFor="country">
                            {t.country} <span className="text-red-400">*</span>
                        </label>
                        <select
                            id="country"
                            value={form.country}
                            onChange={e => handleChange('country', e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                        >
                            <option value="">{t.countryPlaceholder}</option>
                            {COUNTRIES.map(c => (
                                <option key={c.code} value={c.name}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5" htmlFor="city">
                            {t.city} <span className="text-muted-foreground text-xs">{t.cityOptional}</span>
                        </label>
                        <input
                            id="city"
                            type="text"
                            value={form.city}
                            onChange={e => handleChange('city', e.target.value)}
                            placeholder={t.cityPlaceholder}
                            className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                        />
                    </div>
                </div>

                {/* Phone: dial code select + local number input */}
                <div>
                    <label className="block text-sm font-medium mb-1.5">
                        {t.phone} <span className="text-muted-foreground text-xs">{t.phoneOptional}</span>
                    </label>
                    <div className="grid grid-cols-[130px_1fr] sm:grid-cols-[140px_1fr] gap-2">
                        <select
                            id="phone_dial"
                            value={dialCode}
                            onChange={e => { setDialCode(e.target.value); if (message) setMessage(null) }}
                            className="w-full px-2 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm"
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
                            placeholder={t.phonePlaceholder}
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
                    {isSaving ? t.saving : t.save}
                </button>
            </div>
        </form>
    )
}
