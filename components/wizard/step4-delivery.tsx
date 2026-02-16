'use client'

import { useWizard, DeliveryMode } from './wizard-context'
import { useState, useEffect, useCallback, useMemo, type ChangeEvent } from 'react'
import Link from 'next/link'
import { type Plan, getPlanLimits } from '@/lib/plans'
import { CreateContactForm } from './create-contact-form'

interface Step4Props {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dictionary: any // Using specific type earlier, but simplifying for flexibility with new structure
    userPlan: Plan
}

interface Contact {
    id: string
    name: string
    email: string
}

export function Step4Delivery({ dictionary, userPlan }: Step4Props) {
    const { data, updateData } = useWizard()
    const limits = getPlanLimits(userPlan)
    const [selectedTab, setSelectedTab] = useState<DeliveryMode | 'test'>(data.deliveryMode || 'checkin')

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

    const handleSelect = useCallback((mode: DeliveryMode | 'test') => {
        setSelectedTab(mode)

        if (mode === 'checkin') {
            fetchContacts()
        }

        if (mode === 'test') {
            const testDate = new Date(Date.now() + 5 * 60 * 1000)
            updateData({
                deliveryMode: 'date',
                deliverAt: testDate.toISOString()
            })
        } else {
            updateData({ deliveryMode: mode as DeliveryMode })
        }
    }, [updateData, fetchContacts])

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
            title: dictionary.date.title,
            description: dictionary.date.description,
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            mode: 'checkin',
            title: dictionary.checkin.title,
            description: dictionary.checkin.description,
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            mode: 'test',
            title: dictionary.test.title,
            description: dictionary.test.description,
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
    ], [dictionary])

    const [minDate] = useState(() => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return tomorrow.toISOString().split('T')[0]
    })

    const handleIntervalChange = (e: ChangeEvent<HTMLSelectElement>) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateData({ checkinIntervalDays: Number(e.target.value) as any, deliveryMode: 'checkin' })
    }

    const maxContacts = userPlan === 'free' ? 1 : 3
    const currentContacts = data.trustedContactIds || []

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">{dictionary.title}</h2>
                <p className="text-muted-foreground mt-2">{dictionary.subtitle}</p>
            </div>

            <div className="max-w-xl mx-auto space-y-4">
                {options.map((option) => (
                    <div key={option.mode}>
                        <button
                            onClick={() => handleSelect(option.mode as DeliveryMode | 'test')}
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
                                    <div>
                                        <label className="block text-sm font-medium mb-2">{dictionary.date.label}</label>
                                        <input
                                            type="date"
                                            min={minDate}
                                            value={data.deliverAt ? data.deliverAt.split('T')[0] : ''}
                                            onChange={(e) => {
                                                if (!e.target.value) return;
                                                const localDate = new Date(e.target.value + 'T00:00:00');
                                                updateData({ deliverAt: localDate.toISOString(), deliveryMode: 'date' });
                                            }}
                                            className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                )}

                                {option.mode === 'checkin' && (
                                    <div className="space-y-6">
                                        {/* Interval Selector */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">{dictionary.checkin.interval}</label>
                                            <select
                                                value={data.checkinIntervalDays}
                                                onChange={handleIntervalChange}
                                                className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary"
                                            >
                                                {/* All Options Available for All Plans */}
                                                {/* <option value={7}>{dictionary.checkin.days7 || '7 days'}</option> Removed per request */}
                                                <option value={30}>{String(dictionary.checkin.days30).replace('(Pro)', '').trim()}</option>
                                                <option value={60}>{String(dictionary.checkin.days60).replace('(Pro)', '').trim()}</option>
                                                <option value={90}>{String(dictionary.checkin.days90).replace('(Pro)', '').trim()}</option>
                                            </select>
                                        </div>

                                        {/* Trusted Contacts Selector */}
                                        <div>
                                            <label className="block text-sm font-medium mb-3 flex justify-between items-center">
                                                <span>Trusted Contacts</span>
                                                {userPlan === 'free' && <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">Free Limit: 1</span>}
                                            </label>

                                            <div className="space-y-3">
                                                {isCreating ? (
                                                    <CreateContactForm
                                                        onCancel={() => setIsCreating(false)}
                                                        onSuccess={handleContactCreated}
                                                    />
                                                ) : (
                                                    <>
                                                        {/* Always show at least one selector, even if contacts list is empty */}
                                                        {Array.from({ length: Math.min(Math.max(currentContacts.length + 1, 1), maxContacts) }).map((_, index) => (
                                                            <div key={index} className="flex flex-col gap-1">
                                                                <label className="text-xs font-medium text-muted-foreground">
                                                                    {userPlan === 'free' ? 'Contacto de confianza' : `Contacto de confianza ${index + 1}`}
                                                                </label>
                                                                <select
                                                                    value={currentContacts[index] || ''}
                                                                    onChange={(e) => handleContactChange(index, e.target.value)}
                                                                    className="w-full px-4 py-2.5 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                                                                    required={index === 0} // First one is mandatory
                                                                >
                                                                    <option value="">-- Seleccionar --</option>
                                                                    {contacts.map(c => (
                                                                        <option
                                                                            key={c.id}
                                                                            value={c.id}
                                                                            disabled={currentContacts.includes(c.id) && currentContacts[index] !== c.id} // Disable if selected elsewhere
                                                                        >
                                                                            {c.name} ({c.email})
                                                                        </option>
                                                                    ))}
                                                                    <option value="new" className="font-semibold text-primary">+ Agregar nuevo contacto...</option>
                                                                </select>
                                                            </div>
                                                        ))}
                                                    </>
                                                )}

                                                {contacts.length === 0 && !isCreating && !loadingContacts && (
                                                    <p className="text-xs text-amber-600">
                                                        ⚠ Debes seleccionar un contacto de confianza para continuar.
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                                            {dictionary.checkin.note}
                                        </p>
                                    </div>
                                )}

                                {option.mode === 'test' && (
                                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                                        <p className="text-sm font-medium text-primary flex items-center gap-2">
                                            <span className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                            </span>
                                            {dictionary.test.note}
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


