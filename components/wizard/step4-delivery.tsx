'use client'

import { useWizard, DeliveryMode, WizardData } from './wizard-context'
import { useState, useEffect, useCallback, useMemo, useRef, type ChangeEvent } from 'react'
import Link from 'next/link'
import { type Plan, getPlanLimits } from '@/lib/plans'
import { CreateContactForm } from './create-contact-form'

// ─── Wheel Column ─────────────────────────────────────────────────────────────
function WheelColumn({ items, value, onChange, formatItem }: {
    items: number[]
    value: number
    onChange: (val: number) => void
    formatItem?: (val: number) => string
}) {
    const ITEM_H = 48
    const ref = useRef<HTMLDivElement>(null)
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
    const skipRef = useRef(false)

    // Scroll to selected item whenever value changes externally
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const idx = items.indexOf(value)
        if (idx === -1) return
        skipRef.current = true
        el.scrollTop = idx * ITEM_H
        setTimeout(() => { skipRef.current = false }, 50)
    }, [value, items])

    const handleScroll = () => {
        if (skipRef.current) return
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
            const el = ref.current
            if (!el) return
            const idx = Math.round(el.scrollTop / ITEM_H)
            const clamped = Math.max(0, Math.min(idx, items.length - 1))
            el.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' })
            if (items[clamped] !== value) onChange(items[clamped])
        }, 120)
    }

    const handleItemClick = (val: number) => {
        if (skipRef.current || val === value) return
        const idx = items.indexOf(val)
        if (idx === -1) return
        const el = ref.current
        if (!el) return
        
        skipRef.current = true
        el.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' })
        onChange(val)
        setTimeout(() => { skipRef.current = false }, 300)
    }

    return (
        <div className="relative flex-1 select-none">
            {/* Top fade */}
            <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-card to-transparent pointer-events-none z-10" />
            {/* Bottom fade */}
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none z-10" />
            {/* Selection lines */}
            <div className="absolute inset-x-3 top-12 h-px bg-border pointer-events-none z-10" />
            <div className="absolute inset-x-3 bottom-12 h-px bg-border pointer-events-none z-10" />
            
            <div
                ref={ref}
                onScroll={handleScroll}
                className="h-36 overflow-y-scroll snap-y snap-mandatory no-scrollbar overscroll-contain"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <div className="h-12" />
                {items.map(item => (
                    <div
                        key={item}
                        onClick={() => handleItemClick(item)}
                        className={`h-12 flex items-center justify-center snap-center text-lg font-medium transition-all duration-200 cursor-pointer ${item === value ? 'text-primary scale-110' : 'text-muted-foreground/60 hover:text-primary/70'}`}
                    >
                        {formatItem ? formatItem(item) : String(item).padStart(2, '0')}
                    </div>
                ))}
                <div className="h-12" />
            </div>
        </div>
    )
}

// ─── Date Wheel Picker ────────────────────────────────────────────────────────
function DateWheelPicker({ value, min, onChange, locale }: {
    value: string
    min: string
    onChange: (date: string) => void
    locale: string
}) {
    const [y, m, d] = value.split('-').map(Number)
    const minYear = parseInt(min.split('-')[0])

    const years = useMemo(() => Array.from({ length: 30 }, (_, i) => minYear + i), [minYear])
    const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), [])
    const days = useMemo(() => {
        const count = new Date(y, m, 0).getDate()
        return Array.from({ length: count }, (_, i) => i + 1)
    }, [y, m])

    const monthNames = useMemo(() =>
        Array.from({ length: 12 }, (_, i) =>
            new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(2000, i, 1))
        ), [locale])

    const commit = (newY: number, newM: number, newD: number) => {
        const maxDay = new Date(newY, newM, 0).getDate()
        const safeD = Math.min(newD, maxDay)
        let dateStr = `${newY}-${String(newM).padStart(2, '0')}-${String(safeD).padStart(2, '0')}`
        
        // Clamp to minimum allowed date instead of ignoring the change
        if (dateStr < min) {
            dateStr = min
        }
        
        onChange(dateStr)
    }

    return (
        <div className="flex bg-card border border-border rounded-xl overflow-hidden">
            <WheelColumn items={days} value={d} onChange={nd => commit(y, m, nd)} />
            <WheelColumn
                items={months}
                value={m}
                onChange={nm => commit(y, nm, d)}
                formatItem={val => monthNames[val - 1]}
            />
            <WheelColumn items={years} value={y} onChange={ny => commit(ny, m, d)} />
        </div>
    )
}

// ─── Date Dropdown Picker (Desktop) ──────────────────────────────────────────
function DateDropdownPicker({ value, min, onChange, locale }: {
    value: string
    min: string
    onChange: (date: string) => void
    locale: string
}) {
    const [y, m, d] = value.split('-').map(Number)
    const minYear = parseInt(min.split('-')[0])

    const years = useMemo(() => Array.from({ length: 30 }, (_, i) => minYear + i), [minYear])
    const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), [])
    const days = useMemo(() => {
        const count = new Date(y, m, 0).getDate()
        return Array.from({ length: count }, (_, i) => i + 1)
    }, [y, m])

    const monthNames = useMemo(() =>
        Array.from({ length: 12 }, (_, i) =>
            new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2000, i, 1))
        ), [locale])

    const commit = (newY: number, newM: number, newD: number) => {
        const maxDay = new Date(newY, newM, 0).getDate()
        const safeD = Math.min(newD, maxDay)
        let dateStr = `${newY}-${String(newM).padStart(2, '0')}-${String(safeD).padStart(2, '0')}`
        if (dateStr < min) dateStr = min
        onChange(dateStr)
    }

    const selectClass = "bg-card border border-border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer appearance-none pr-8"

    return (
        <div className="flex gap-3">
            {/* Day */}
            <div className="relative">
                <select
                    value={d}
                    onChange={e => commit(y, m, parseInt(e.target.value))}
                    className={selectClass}
                    style={{ minWidth: '72px' }}
                >
                    {days.map(day => (
                        <option key={day} value={day}>{String(day).padStart(2, '0')}</option>
                    ))}
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            {/* Month */}
            <div className="relative flex-1">
                <select
                    value={m}
                    onChange={e => commit(y, parseInt(e.target.value), d)}
                    className={`${selectClass} w-full`}
                >
                    {months.map(month => (
                        <option key={month} value={month}>{monthNames[month - 1]}</option>
                    ))}
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            {/* Year */}
            <div className="relative">
                <select
                    value={y}
                    onChange={e => commit(parseInt(e.target.value), m, d)}
                    className={selectClass}
                    style={{ minWidth: '88px' }}
                >
                    {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    )
}

interface Step4Props {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dictionary: any // Using specific type earlier, but simplifying for flexibility with new structure
    userPlan: Plan
    locale: string
    userEmail: string
}

interface Contact {
    id: string
    name: string
    email: string
}

export function Step4Delivery({ dictionary, userPlan, locale, userEmail }: Step4Props) {
    const { data, updateData } = useWizard()
    const step4Dict = dictionary.wizard.step4
    const limits = getPlanLimits(userPlan)
    const [selectedTab, setSelectedTab] = useState<DeliveryMode | null>(data.deliveryMode || null)

    // Trusted Contacts State
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loadingContacts, setLoadingContacts] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    // Sync local tab with data on mount (editing case only)
    useEffect(() => {
        if (data.deliveryMode) {
            setSelectedTab(data.deliveryMode)
        }
    }, [data.deliveryMode])

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

    // Load contacts on mount only when editing an existing checkin message
    useEffect(() => {
        if (data.deliveryMode === 'checkin') {
            fetchContacts()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Sync trustedContactEmails whenever contacts or trustedContactIds change
    useEffect(() => {
        if (data.deliveryMode === 'checkin') {
            const currentIds = data.trustedContactIds || [];
            const emails = currentIds
                .map(id => contacts.find(c => c.id === id)?.email)
                .filter(Boolean) as string[];
                
            const currentEmails = data.trustedContactEmails || [];
            if (JSON.stringify(emails) !== JSON.stringify(currentEmails)) {
                updateData({ trustedContactEmails: emails });
            }
        }
    }, [contacts, data.trustedContactIds, data.trustedContactEmails, data.deliveryMode, updateData])

    // REMOVED: Auto-correct interval useEffect (Free plan interval restriction removed)

    const handleSelect = useCallback((mode: DeliveryMode) => {
        setSelectedTab(mode)

        if (mode === 'checkin') {
            fetchContacts()
            updateData({ deliveryMode: mode })
        } else if (mode === 'date') {
            const updates: Partial<WizardData> = { deliveryMode: 'date' }
            if (!data.deliverAt) {
                const defaultDate = new Date()
                defaultDate.setHours(defaultDate.getHours() + 1, 0, 0, 0)
                // If already past 23:00, roll to next day at 9am
                if (defaultDate.getHours() === 0) {
                    defaultDate.setDate(defaultDate.getDate() + 1)
                    defaultDate.setHours(9, 0, 0, 0)
                }
                updates.deliverAt = defaultDate.toISOString()
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

    const ENABLE_PAST_DATES = process.env.NEXT_PUBLIC_ENABLE_PAST_DATES === 'true'
    const [minDate] = useState(() => {
        if (ENABLE_PAST_DATES) return '1970-01-01'
        const now = new Date()
        const y = now.getFullYear()
        const m = String(now.getMonth() + 1).padStart(2, '0')
        const d = String(now.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
    })

    const currentDate = useMemo(() => {
        if (!data.deliverAt) return ENABLE_PAST_DATES ? new Date().toISOString().slice(0, 10) : minDate
        const d = new Date(data.deliverAt)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }, [data.deliverAt, minDate, ENABLE_PAST_DATES])

    const currentTime = useMemo(() => {
        if (!data.deliverAt) return '12:00'
        const d = new Date(data.deliverAt)
        const h = String(d.getHours()).padStart(2, '0')
        const m = String(d.getMinutes()).padStart(2, '0')
        return `${h}:${m}`
    }, [data.deliverAt])


    const ENABLE_TEST_INTERVALS = process.env.NEXT_PUBLIC_ENABLE_TEST_INTERVALS === 'true'
    const BASE_INTERVALS = [30, 60, 90]
    const intervals = ENABLE_TEST_INTERVALS ? [1, ...BASE_INTERVALS] : BASE_INTERVALS

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
                            <div className="mt-3 ml-10 md:ml-0 p-4 bg-card rounded-lg border border-border animate-in slide-in-from-top-1">
                                {option.mode === 'date' && (
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium mb-2">{step4Dict.date.label}</label>
                                            {/* Mobile: drum wheel picker */}
                                            <div className="md:hidden">
                                                <DateWheelPicker
                                                    value={currentDate}
                                                    min={minDate}
                                                    onChange={(newDate) => {
                                                        const localDate = new Date(newDate + 'T' + currentTime + ':00')
                                                        updateData({ deliverAt: localDate.toISOString(), deliveryMode: 'date' })
                                                    }}
                                                    locale={locale}
                                                />
                                            </div>
                                            {/* Desktop: dropdown picker */}
                                            <div className="hidden md:block">
                                                <DateDropdownPicker
                                                    value={currentDate}
                                                    min={minDate}
                                                    onChange={(newDate) => {
                                                        const localDate = new Date(newDate + 'T' + currentTime + ':00')
                                                        updateData({ deliverAt: localDate.toISOString(), deliveryMode: 'date' })
                                                    }}
                                                    locale={locale}
                                                />
                                            </div>
                                        </div>
                                        <div className="w-full sm:w-auto">
                                            <label className="block text-sm font-medium mb-2">{step4Dict.date.timeLabel}</label>
                                            {/* Mobile: spinner */}
                                            <div className="md:hidden">
                                                <TimePickerSpinner
                                                    value={currentTime}
                                                    onChange={(newTime) => {
                                                        const localDate = new Date(currentDate + 'T' + newTime + ':00');
                                                        updateData({ deliverAt: localDate.toISOString(), deliveryMode: 'date' });
                                                    }}
                                                />
                                            </div>
                                            {/* Desktop: dropdown */}
                                            <div className="hidden md:block">
                                                <TimeDropdownPicker
                                                    value={currentTime}
                                                    onChange={(newTime) => {
                                                        const localDate = new Date(currentDate + 'T' + newTime + ':00');
                                                        updateData({ deliverAt: localDate.toISOString(), deliveryMode: 'date' });
                                                    }}
                                                />
                                            </div>
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
                                            <label className="block text-sm font-medium mb-1">{step4Dict.checkin.interval}</label>
                                            <p className="text-[11px] leading-relaxed text-muted-foreground mb-3">
                                                {step4Dict.checkin.intervalHelp}
                                            </p>
                                            <select
                                                value={data.checkinIntervalDays}
                                                onChange={handleIntervalChange}
                                                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all cursor-pointer"
                                            >
                                                {intervals.map(days => {
                                                    const key = days === 1 ? '1_test' : String(days)
                                                    return (
                                                        <option key={days} value={days}>
                                                            {(step4Dict.checkin as any).intervals?.[key] ?? `${days}d`}
                                                        </option>
                                                    )
                                                })}
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
                                                            errorCreating: dictionary.trustedContact.errorCreating,
                                                            ownEmailError: dictionary.trustedContact.ownEmailError
                                                        }}
                                                        locale={locale}
                                                        userEmail={userEmail}
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
                                                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary text-sm cursor-pointer outline-none transition-all"
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
                                                    <div className="mt-4 flex items-start gap-3 rounded-xl p-4 text-[13px] leading-relaxed animate-in fade-in slide-in-from-top-1"
                                                        style={{ background: 'rgba(196,98,58,0.06)', border: '1px solid rgba(196,98,58,0.15)', color: '#A34F2E' }}>
                                                        <div className="shrink-0 mt-0.5">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                        <span>{step4Dict.checkin.posthumousContactRequired}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

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

function TimePickerSpinner({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    // value is HH:MM in 24h
    const [h24, m24] = value.split(':').map(Number)

    // Convert to 12h internal state
    const initialPeriod = h24 >= 12 ? 'PM' : 'AM'
    const initialH12 = h24 % 12 === 0 ? 12 : h24 % 12
    const initialM = Math.floor(m24 / 5) * 5 // Round to nearest 5 for the spinner

    const [h12, setH12] = useState(initialH12)
    const [m, setM] = useState(initialM)
    const [period, setPeriod] = useState(initialPeriod)
    const minuteInputRef = useRef<HTMLInputElement>(null)

    // Notify parent on any change
    const updateParent = (newH12: number, newM: number, newPeriod: string) => {
        let h24_final = newH12 % 12
        if (newPeriod === 'PM') h24_final += 12

        const h_str = String(h24_final).padStart(2, '0')
        const m_str = String(newM).padStart(2, '0')
        onChange(`${h_str}:${m_str}`)
    }

    const adjustHour = (delta: number) => {
        let next = h12 + delta
        if (next > 12) next = 1
        if (next < 1) next = 12
        setH12(next)
        updateParent(next, m, period)
    }

    const adjustMinute = (delta: number) => {
        let next = m + delta
        if (next >= 60) next = 0
        if (next < 0) next = 55
        setM(next)
        updateParent(h12, next, period)
    }

    const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(-2)
        const num = Number(val)
        if (val.length > 0) {
            setH12(num)
            if (val.length === 2) {
                if (num > 12) setH12(12)
                if (num === 0) setH12(1)
                minuteInputRef.current?.focus()
                updateParent(num > 12 ? 12 : (num === 0 ? 1 : num), m, period)
            }
        } else {
            setH12(0)
        }
    }

    const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(-2)
        const num = Number(val)
        if (val.length > 0) {
            setM(num)
            if (val.length === 2) {
                if (num > 59) setM(59)
                updateParent(h12, num > 59 ? 59 : num, period)
            }
        } else {
            setM(0)
        }
    }

    const handleBlur = () => {
        // Validation on blur
        let finalH = h12
        let finalM = m
        if (h12 > 12) finalH = 12
        if (h12 < 1) finalH = 1
        if (m > 59) finalM = 59
        setH12(finalH)
        setM(finalM)
        updateParent(finalH, finalM, period)
    }

    const togglePeriod = (p: string) => {
        setPeriod(p)
        updateParent(h12, m, p)
    }

    const SpinnerButton = ({ onClick, children }: { onClick: () => void, children: React.ReactNode }) => (
        <button
            onClick={onClick}
            type="button"
            className="w-14 h-6 flex items-center justify-center rounded-[6px] border border-border/30 bg-cream/20 text-primary/60 hover:bg-primary/5 hover:text-primary transition-all active:scale-95 p-0"
        >
            {children}
        </button>
    )


    return (
        <div className="flex items-center gap-2 select-none">
            {/* Hours */}
            <div className="flex flex-col items-center gap-1.5">
                <SpinnerButton onClick={() => adjustHour(1)}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15l7-7 7 7" />
                    </svg>
                </SpinnerButton>
                <input
                    type="text"
                    inputMode="numeric"
                    value={h12 === 0 ? '' : String(h12).padStart(2, '0')}
                    onChange={handleHourChange}
                    onBlur={handleBlur}
                    className="w-14 h-12 flex items-center justify-center bg-cream/10 border border-border/40 rounded-xl text-xl font-medium text-primary text-center focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                />
                <SpinnerButton onClick={() => adjustHour(-1)}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                </SpinnerButton>
            </div>

            <div className="text-xl font-medium text-primary/30 mt-1">:</div>

            {/* Minutes */}
            <div className="flex flex-col items-center gap-1.5">
                <SpinnerButton onClick={() => adjustMinute(5)}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15l7-7 7 7" />
                    </svg>
                </SpinnerButton>
                <input
                    ref={minuteInputRef}
                    type="text"
                    inputMode="numeric"
                    value={String(m).padStart(2, '0')}
                    onChange={handleMinuteChange}
                    onBlur={handleBlur}
                    className="w-14 h-12 flex items-center justify-center bg-cream/10 border border-border/40 rounded-xl text-xl font-medium text-primary text-center focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                />
                <SpinnerButton onClick={() => adjustMinute(-5)}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                </SpinnerButton>
            </div>

            <div className="flex flex-col gap-1 ml-1 h-full pt-[33px] items-center justify-center">
                <button
                    type="button"
                    onClick={() => togglePeriod('AM')}
                    className={`w-14 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all border ${period === 'AM'
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-cream/20 text-muted-foreground border-border hover:border-primary/30'
                        }`}
                >
                    AM
                </button>
                <button
                    type="button"
                    onClick={() => togglePeriod('PM')}
                    className={`w-14 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all border ${period === 'PM'
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-cream/20 text-muted-foreground border-border hover:border-primary/30'
                        }`}
                >
                    PM
                </button>
            </div>
        </div>
    )
}

function TimeDropdownPicker({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    // value is HH:MM in 24h
    const [h24, m24] = value.split(':').map(Number)
    const period = h24 >= 12 ? 'PM' : 'AM'
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12
    const minuteRounded = [0, 15, 30, 45].reduce((prev, curr) =>
        Math.abs(curr - m24) < Math.abs(prev - m24) ? curr : prev, 0)

    const emit = (newH12: number, newMinute: number, newPeriod: string) => {
        let h = newH12 % 12
        if (newPeriod === 'PM') h += 12
        onChange(`${String(h).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`)
    }

    const selectClass = "px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all cursor-pointer text-sm font-medium appearance-none pr-7 bg-no-repeat"
    const chevronStyle = { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundPosition: 'right 8px center', backgroundSize: '14px' }

    return (
        <div className="flex items-center gap-2">
            <select
                value={h12}
                onChange={e => emit(Number(e.target.value), minuteRounded, period)}
                className={selectClass}
                style={chevronStyle}
            >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                ))}
            </select>
            <span className="text-lg font-medium text-muted-foreground">:</span>
            <select
                value={minuteRounded}
                onChange={e => emit(h12, Number(e.target.value), period)}
                className={selectClass}
                style={chevronStyle}
            >
                {[0, 15, 30, 45].map(m => (
                    <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                ))}
            </select>
            <select
                value={period}
                onChange={e => emit(h12, minuteRounded, e.target.value)}
                className={selectClass}
                style={chevronStyle}
            >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
            </select>
        </div>
    )
}


