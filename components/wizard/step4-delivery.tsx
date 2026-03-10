'use client'

import { useWizard, DeliveryMode, WizardData } from './wizard-context'
import { useState, useEffect, useCallback, useMemo, type ChangeEvent } from 'react'
import Link from 'next/link'
import { type Plan, getPlanLimits } from '@/lib/plans'
import { CreateContactForm } from './create-contact-form'

interface Step4Props {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dictionary: any // Using specific type earlier, but simplifying for flexibility with new structure
    userPlan: Plan
    locale: string
}

interface Contact {
    id: string
    name: string
    email: string
}

export function Step4Delivery({ dictionary, userPlan, locale }: Step4Props) {
    const { data, updateData } = useWizard()
    const step4Dict = dictionary.wizard.step4
    const limits = getPlanLimits(userPlan)
    const [selectedTab, setSelectedTab] = useState<DeliveryMode>(data.deliveryMode || 'checkin')

    // Trusted Contacts State
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loadingContacts, setLoadingContacts] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    // Sync local tab with data on mount
    useEffect(() => {
        if (data.deliveryMode) {
            setSelectedTab(data.deliveryMode)
        } else {
            // Default to 'checkin' if nothing selected
            updateData({ deliveryMode: 'checkin' })
            setSelectedTab('checkin')
        }
    }, [data.deliveryMode, updateData])

    const fetchContacts = useCallback(() => {
        setLoadingContacts(true)
        console.log('Fetching trusted contacts...')
        fetch('/api/trusted-contacts')
            .then(res => {
                if (res.ok) return res.json()
                console.error('Failed to fetch contacts:', res.status, res.statusText)
                return []
            })
            .then(data => {
                console.log('Fetched contacts:', data)
                if (Array.isArray(data)) setContacts(data)
            })
            .catch(err => console.error('Error fetching contacts:', err))
            .finally(() => setLoadingContacts(false))
    }, [])

    // Load contacts on mount if initially checkin
    useEffect(() => {
        if (selectedTab === 'checkin') {
            fetchContacts()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // REMOVED: Auto-correct interval useEffect (Free plan interval restriction removed)

    const handleSelect = useCallback((mode: DeliveryMode) => {
        setSelectedTab(mode)

        if (mode === 'checkin') {
            fetchContacts()
            updateData({ deliveryMode: mode })
        } else if (mode === 'date') {
            const updates: Partial<WizardData> = { deliveryMode: 'date' }
            if (!data.deliverAt) {
                const tomorrow = new Date()
                tomorrow.setDate(tomorrow.getDate() + 1)
                tomorrow.setHours(0, 0, 0, 0)
                updates.deliverAt = tomorrow.toISOString()
            }
            updateData(updates)
        }
    }, [updateData, fetchContacts, data.deliverAt])

    const handleContactChange = (index: number, contactId: string) => {
        if (contactId === 'new') {
            setIsCreating(true)
            return
        }

        const current = [...(data.trustedContactIds || [])]

        if (contactId === '') {
            // If clearing a slot, remove it if it exists
            // But wait, if we have [A, B] and we clear A (index 0), do we want [B]? 
            // Or do we represent it as [empty, B]?
            // UI maps `currentContacts` directly.
            // If I remove index 0, B becomes index 0. User sees B moves up.
            // That's acceptable behavior for now.
            if (index < current.length) {
                current.splice(index, 1)
            }
        } else {
            // Assign at index
            current[index] = contactId
        }

        // Filter out any potential empty strings just in case
        const cleaned = current.filter(id => id && id !== '')
        updateData({ trustedContactIds: cleaned })
    }

    const handleContactCreated = (newContact: Contact) => {
        setContacts(prev => [...prev, newContact])
        setIsCreating(false)
        // Auto-select the new contact
        const current = data.trustedContactIds || []
        if (current.length < (userPlan === 'free' ? 1 : 3)) {
            updateData({ trustedContactIds: [...current, newContact.id] })
        }
    }

    const options = useMemo(() => [
        {
            mode: 'date',
            title: step4Dict.date.title,
            description: step4Dict.date.description,
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            mode: 'checkin',
            title: step4Dict.checkin.title,
            description: step4Dict.checkin.description,
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
    ], [step4Dict])

    const [minDate] = useState(() => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return tomorrow.toISOString().split('T')[0]
    })

    const currentDate = useMemo(() => {
        if (data.deliverAt) return data.deliverAt.split('T')[0]
        return minDate
    }, [data.deliverAt, minDate])

    const currentTime = useMemo(() => {
        if (data.deliverAt && data.deliverAt.includes('T')) {
            return data.deliverAt.split('T')[1].substring(0, 5)
        }
        return '00:00'
    }, [data.deliverAt])

    const handleIntervalChange = (e: ChangeEvent<HTMLSelectElement>) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateData({ checkinIntervalDays: Number(e.target.value) as any, deliveryMode: 'checkin' })
    }

    const maxContacts = userPlan === 'free' ? 1 : 3
    const currentContacts = data.trustedContactIds || []

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">{step4Dict.title}</h2>
                <p className="text-muted-foreground mt-2">{step4Dict.subtitle}</p>
            </div>

            <div className="max-w-xl mx-auto space-y-4">
                {options.map((option) => (
                    <div key={option.mode}>
                        <button
                            onClick={() => handleSelect(option.mode as DeliveryMode)}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedTab === option.mode
                                ? 'border-primary bg-primary/5 shadow-sm shadow-primary/5'
                                : 'border-border hover:border-primary/30'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`mt-0.5 ${selectedTab === option.mode ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {option.icon}
                                </div>
                                <div>
                                    <h3 className="font-semibold">{option.title}</h3>
                                    <p className="text-sm text-muted-foreground">{option.description}</p>
                                </div>
                            </div>
                        </button>

                        {selectedTab === option.mode && (
                            <div className="mt-3 ml-10 p-4 bg-card rounded-lg border border-border animate-in slide-in-from-top-1">
                                {option.mode === 'date' && (
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium mb-2">{step4Dict.date.label}</label>
                                            <input
                                                type="date"
                                                min={minDate}
                                                value={currentDate}
                                                onChange={(e) => {
                                                    if (!e.target.value) return;
                                                    const localDate = new Date(e.target.value + 'T' + currentTime + ':00');
                                                    updateData({ deliverAt: localDate.toISOString(), deliveryMode: 'date' });
                                                }}
                                                className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                        <div className="w-full sm:w-48">
                                            <label className="block text-sm font-medium mb-2">{step4Dict.date.timeLabel}</label>
                                            <TimeInput
                                                value={currentTime}
                                                errorLabel={step4Dict.date.timeError}
                                                onChange={(newTime) => {
                                                    const localDate = new Date(currentDate + 'T' + newTime + ':00');
                                                    updateData({ deliverAt: localDate.toISOString(), deliveryMode: 'date' });
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {option.mode === 'date' && (
                                    <p className="mt-4 text-xs text-muted-foreground pt-2 border-t border-border">
                                        ℹ️ {step4Dict.date.optionalContactNote}
                                    </p>
                                )}

                                {option.mode === 'checkin' && (
                                    <div className="space-y-6">
                                        {/* Interval Selector */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">{step4Dict.checkin.interval}</label>
                                            <select
                                                value={data.checkinIntervalDays}
                                                onChange={handleIntervalChange}
                                                className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary"
                                            >
                                                {/* All Options Available for All Plans */}
                                                {/* <option value={7}>{step4Dict.checkin.days7 || '7 days'}</option> Removed per request */}
                                                <option value={30}>{String(step4Dict.checkin.days30).replace('(Pro)', '').trim()}</option>
                                                <option value={60}>{String(step4Dict.checkin.days60).replace('(Pro)', '').trim()}</option>
                                                <option value={90}>{String(step4Dict.checkin.days90).replace('(Pro)', '').trim()}</option>
                                            </select>
                                        </div>

                                        {/* Trusted Contacts Selector */}
                                        <div>
                                            <label className="block text-sm font-medium mb-3 flex justify-between items-center">
                                                <span>{step4Dict.checkin.trustedContacts}</span>
                                                {userPlan === 'free' && <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{step4Dict.checkin.freeLimit}</span>}
                                            </label>

                                            <div className="space-y-3">
                                                {isCreating ? (
                                                    <CreateContactForm
                                                        dictionary={{
                                                            ...dictionary.trustedContact,
                                                            cancel: dictionary.common.cancel,
                                                            save: dictionary.trustedContact.save,
                                                            saving: dictionary.trustedContact.saving,
                                                            errorCreating: dictionary.trustedContact.errorCreating
                                                        }}
                                                        locale={locale}
                                                        onCancel={() => setIsCreating(false)}
                                                        onSuccess={handleContactCreated}
                                                    />
                                                ) : (
                                                    <>
                                                        {/* Always show at least one selector, even if contacts list is empty */}
                                                        {Array.from({ length: Math.min(Math.max(currentContacts.length + 1, 1), maxContacts) }).map((_, index) => (
                                                            <div key={index} className="flex flex-col gap-1">
                                                                <label className="text-xs font-medium text-muted-foreground">
                                                                    {userPlan === 'free' ? step4Dict.checkin.contactLabel : step4Dict.checkin.contactLabelNumbered.replace('{number}', String(index + 1))}
                                                                </label>
                                                                <select
                                                                    value={currentContacts[index] || ''}
                                                                    onChange={(e) => handleContactChange(index, e.target.value)}
                                                                    className="w-full px-4 py-2.5 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                                                                >
                                                                    <option value="">-- {step4Dict.checkin.selectPlaceholder} --</option>
                                                                    {contacts.map(c => (
                                                                        <option
                                                                            key={c.id}
                                                                            value={c.id}
                                                                            disabled={currentContacts.includes(c.id) && currentContacts[index] !== c.id}
                                                                        >
                                                                            {c.name} ({c.email})
                                                                        </option>
                                                                    ))}
                                                                    <option value="new" className="font-semibold text-primary font-medium">{step4Dict.checkin.addNew}</option>
                                                                </select>
                                                            </div>
                                                        ))}
                                                    </>
                                                )}

                                                {currentContacts.length === 0 && !isCreating && !loadingContacts && (
                                                    <div className="mt-2 flex items-start gap-2 rounded-xl p-3 text-sm animate-in fade-in"
                                                        style={{ background: 'rgba(196,98,58,0.08)', border: '1px solid rgba(196,98,58,0.25)', color: '#C4623A' }}>
                                                        <span className="text-base leading-none">⚠️</span>
                                                        <span>{step4Dict.checkin.posthumousContactRequired}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                                            {step4Dict.checkin.note}
                                        </p>
                                    </div>
                                )}


                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

function TimeInput({ value, onChange, errorLabel }: { value: string, onChange: (val: string) => void, errorLabel: string }) {
    const [inputValue, setInputValue] = useState(value)
    const [isValid, setIsValid] = useState(true)

    useEffect(() => {
        setInputValue(value)
    }, [value])

    const validate = (val: string) => {
        if (val.length === 0) return true
        if (val.length !== 5) return false
        const [h, m] = val.split(':').map(Number)
        return h >= 0 && h < 24 && m >= 0 && m < 60
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '') // Keep only digits

        if (val.length > 4) val = val.substring(0, 4)

        let formatted = val
        if (val.length > 2) {
            formatted = val.substring(0, 2) + ':' + val.substring(2)
        }

        setInputValue(formatted)

        const valid = validate(formatted)
        setIsValid(valid)

        if (formatted.length === 5 && valid) {
            onChange(formatted)
        }
    }

    const handleBlur = () => {
        if (inputValue.length < 5) {
            setInputValue('')
            setIsValid(true)
        } else {
            const valid = validate(inputValue)
            setIsValid(valid)
            if (valid) {
                onChange(inputValue)
            }
        }
    }

    return (
        <div className="space-y-1">
            <input
                type="text"
                placeholder="HH:MM"
                value={inputValue}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 bg-input border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all ${!isValid ? 'border-error ring-error/20' : 'border-border'
                    }`}
                style={{ fontSize: '16px' }}
                maxLength={5}
                inputMode="numeric"
            />
            {!isValid && (
                <p className="text-[11px] text-error font-medium animate-in fade-in slide-in-from-top-1">
                    {errorLabel}
                </p>
            )}
        </div>
    )
}


