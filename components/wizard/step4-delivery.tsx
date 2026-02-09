'use client'

import { useWizard, DeliveryMode } from './wizard-context'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { type Plan, getPlanLimits } from '@/lib/plans'

interface Step4Props {
    dictionary: any // Using specific type earlier, but simplifying for flexibility with new structure
    userPlan: Plan
}

export function Step4Delivery({ dictionary, userPlan }: Step4Props) {
    const { data, updateData } = useWizard()
    const limits = getPlanLimits(userPlan)
    const [selectedTab, setSelectedTab] = useState<DeliveryMode | 'test'>(data.deliveryMode || 'checkin')

    // Trusted Contacts State
    const [contacts, setContacts] = useState<any[]>([])
    const [loadingContacts, setLoadingContacts] = useState(false)

    // Sync local tab with data on mount
    useEffect(() => {
        if (data.deliveryMode) {
            setSelectedTab(data.deliveryMode)
        }
    }, [data.deliveryMode])

    // Load contacts when in checkin mode
    useEffect(() => {
        if (selectedTab === 'checkin') {
            setLoadingContacts(true)
            fetch('/api/trusted-contacts')
                .then(res => {
                    if (res.ok) return res.json()
                    return []
                })
                .then(data => {
                    if (Array.isArray(data)) setContacts(data)
                })
                .catch(console.error)
                .finally(() => setLoadingContacts(false))
        }
    }, [selectedTab])

    // Validate and auto-correct interval if needed
    useEffect(() => {
        if (data.deliveryMode === 'checkin' && !limits.allowedCheckinIntervals.includes(data.checkinIntervalDays)) {
            const validInterval = limits.allowedCheckinIntervals[0] || 30
            // Find explicit interval from allowed list closest to intention? Or just default.
            updateData({ checkinIntervalDays: validInterval as any })
        }
    }, [data.deliveryMode, data.checkinIntervalDays, limits.allowedCheckinIntervals, updateData])

    const handleSelect = (mode: DeliveryMode | 'test') => {
        setSelectedTab(mode)

        if (mode === 'test') {
            const testDate = new Date(Date.now() + 5 * 60 * 1000)
            updateData({
                deliveryMode: 'date',
                deliverAt: testDate.toISOString()
            })
        } else {
            updateData({ deliveryMode: mode as DeliveryMode })
        }
    }

    const toggleContact = (contactId: string) => {
        const current = data.trustedContactIds || []
        if (current.includes(contactId)) {
            updateData({ trustedContactIds: current.filter(id => id !== contactId) })
        } else {
            if (current.length >= 3) return // Max 3
            updateData({ trustedContactIds: [...current, contactId] })
        }
    }

    const options = [
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
    ]

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const minDate = tomorrow.toISOString().split('T')[0]

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">{dictionary.title}</h2>
                <p className="text-muted-foreground mt-2">{dictionary.subtitle}</p>
            </div>

            <div className="max-w-xl mx-auto space-y-4">
                {options.map((option: any) => (
                    <div key={option.mode}>
                        <button
                            onClick={() => handleSelect(option.mode)}
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
                                                onChange={(e) => updateData({ checkinIntervalDays: Number(e.target.value) as any, deliveryMode: 'checkin' })}
                                                className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary"
                                            >
                                                {/* Free Options */}
                                                <option value={7}>{dictionary.checkin.days7 || '7 days'}</option>

                                                {/* Pro Options */}
                                                {[30, 60, 90].map(days => (
                                                    <option
                                                        key={days}
                                                        value={days}
                                                        disabled={userPlan === 'free'}
                                                    >
                                                        {days === 30 ? dictionary.checkin.days30 : days === 60 ? dictionary.checkin.days60 : dictionary.checkin.days90}
                                                        {userPlan === 'free' ? ' (Pro)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            {userPlan === 'free' && (
                                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                                    <span className="text-amber-500">🔒</span>
                                                    {dictionary.checkin.freeNote}
                                                </p>
                                            )}
                                        </div>

                                        {/* Trusted Contacts Selector */}
                                        <div>
                                            <label className="block text-sm font-medium mb-3 flex justify-between items-center">
                                                <span>Trusted Contacts</span>
                                                {userPlan === 'free' && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">PRO</span>}
                                            </label>

                                            {userPlan === 'free' ? (
                                                <div className="p-4 bg-secondary/50 rounded-lg text-center border border-border border-dashed">
                                                    <p className="text-sm text-muted-foreground mb-2">Upgrade to Pro to assign a trusted contact to this message.</p>
                                                    <Link href="/dashboard?upgrade=true" className="text-primary text-sm font-medium hover:underline">
                                                        Unlock Pro Features
                                                    </Link>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {loadingContacts ? (
                                                        <div className="text-sm text-muted-foreground">Loading contacts...</div>
                                                    ) : contacts.length === 0 ? (
                                                        <div className="text-center p-4 border border-dashed border-border rounded-lg">
                                                            <p className="text-sm text-muted-foreground mb-2">You haven't added any trusted contacts yet.</p>
                                                            <Link href="/dashboard/contacts" target="_blank" className="text-primary text-sm hover:underline flex items-center justify-center gap-1">
                                                                Manage Contacts
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                </svg>
                                                            </Link>
                                                        </div>
                                                    ) : (
                                                        <div className="grid gap-2">
                                                            {contacts.map(contact => (
                                                                <label key={contact.id} className="flex items-center p-3 border border-border rounded-lg hover:bg-secondary/20 cursor-pointer transition-colors">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={(data.trustedContactIds || []).includes(contact.id)}
                                                                        onChange={() => toggleContact(contact.id)}
                                                                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                                                    />
                                                                    <div className="ml-3">
                                                                        <span className="block text-sm font-medium text-foreground">{contact.name || contact.email}</span>
                                                                        {contact.name && <span className="block text-xs text-muted-foreground">{contact.email}</span>}
                                                                    </div>
                                                                </label>
                                                            ))}
                                                            <div className="text-right">
                                                                <Link href="/dashboard/contacts" target="_blank" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                                                                    Manage contacts
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
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
