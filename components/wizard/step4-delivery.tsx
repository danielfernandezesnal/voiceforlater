'use client'

import { useWizard, DeliveryMode } from './wizard-context'
import { useState, useEffect } from 'react'
import { type Plan, getPlanLimits } from '@/lib/plans'

interface Step4Props {
    dictionary: {
        title: string
        subtitle: string
        date: {
            title: string
            description: string
            label: string
        }
        checkin: {
            title: string
            description: string
            interval: string
            days7?: string
            days30: string
            days60: string
            days90: string
            note: string
            freeNote?: string
        }
        test: {
            title: string
            description: string
            note: string
        }
    }
    userPlan: Plan
}

export function Step4Delivery({ dictionary, userPlan }: Step4Props) {
    const { data, updateData } = useWizard()
    const limits = getPlanLimits(userPlan)
    const [selectedTab, setSelectedTab] = useState<DeliveryMode | 'test'>(data.deliveryMode || 'checkin')

    // Sync local tab with data on mount
    useEffect(() => {
        if (data.deliveryMode) {
            setSelectedTab(data.deliveryMode)
        }
    }, [data.deliveryMode])

    // Validate and auto-correct interval if needed (e.g. if fallback was 7 but min is 30)
    useEffect(() => {
        if (data.deliveryMode === 'checkin' && !limits.allowedCheckinIntervals.includes(data.checkinIntervalDays)) {
            // Default to the first allowed interval (usually 30)
            const validInterval = limits.allowedCheckinIntervals[0] || 30
            updateData({ checkinIntervalDays: validInterval as any })
        }
    }, [data.deliveryMode, data.checkinIntervalDays, limits.allowedCheckinIntervals, updateData])

    const handleSelect = (mode: DeliveryMode | 'test') => {
        setSelectedTab(mode)

        if (mode === 'test') {
            // eslint-disable-next-line
            const testDate = new Date(Date.now() + 5 * 60 * 1000)
            updateData({
                deliveryMode: 'date',
                deliverAt: testDate.toISOString() // Store full ISO string
            })
        } else {
            updateData({ deliveryMode: mode as DeliveryMode })
        }
    }

    const options: { mode: DeliveryMode | 'test'; title: string; description: string; icon: React.ReactNode }[] = [
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

    // Get tomorrow's date as minimum
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const minDate = tomorrow.toISOString().split('T')[0]

    // Build interval options based on plan
    const intervalOptions = limits.allowedCheckinIntervals.map((days) => ({
        value: days,
        label: days === 7
            ? (dictionary.checkin.days7 || 'Every 7 days')
            : days === 30
                ? dictionary.checkin.days30
                : days === 60
                    ? dictionary.checkin.days60
                    : dictionary.checkin.days90,
        disabled: false,
    }))

    // Add locked options for Free plan to show upgrade opportunity
    if (userPlan === 'free') {
        const proOptions = [30, 60, 90].filter(d => !limits.allowedCheckinIntervals.includes(d))
        proOptions.forEach(days => {
            intervalOptions.push({
                value: days,
                label: `${days === 30 ? dictionary.checkin.days30 : days === 60 ? dictionary.checkin.days60 : dictionary.checkin.days90} (Pro)`,
                disabled: true,
            })
        })
    }

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

                        {/* Expanded options */}
                        {selectedTab === option.mode && (
                            <div className="mt-3 ml-10 p-4 bg-card rounded-lg border border-border">
                                {option.mode === 'date' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2">{dictionary.date.label}</label>
                                        <input
                                            type="date"
                                            min={minDate}
                                            value={data.deliverAt ? data.deliverAt.split('T')[0] : ''}
                                            onChange={(e) => {
                                                if (!e.target.value) return;
                                                // Create date at local midnight
                                                const localDate = new Date(e.target.value + 'T00:00:00');
                                                updateData({ deliverAt: localDate.toISOString(), deliveryMode: 'date' });
                                            }}
                                            className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                                        />
                                    </div>
                                )}

                                {option.mode === 'checkin' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">{dictionary.checkin.interval}</label>
                                            <select
                                                value={data.checkinIntervalDays}
                                                onChange={(e) => updateData({ checkinIntervalDays: Number(e.target.value) as 7 | 30 | 60 | 90, deliveryMode: 'checkin' })}
                                                className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                                            >
                                                {intervalOptions.map((opt) => (
                                                    <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {userPlan === 'free' ? (
                                            <div className="p-3 bg-secondary border border-border rounded-lg">
                                                <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                    </svg>
                                                    {dictionary.checkin.freeNote}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">{dictionary.checkin.note}</p>
                                        )}
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
