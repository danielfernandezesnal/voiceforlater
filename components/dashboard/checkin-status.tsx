'use client'

import { useState, useEffect } from 'react'
import type { CheckinData } from '@/lib/checkins/dashboard-auto-confirm'

interface CheckinStatusProps {
    dictionary: {
        title: string
        nextCheckin: string
        daysRemaining: string
        overdue: string
        confirmButton: string
        confirming: string
        confirmed: string
    }
    locale: string
    /**
     * Server-resolved checkin state. When provided, the widget uses this for
     * the first render and skips the mount-time GET fetch, preventing stale
     * expired state from flashing before the POST completes.
     */
    initialCheckin?: CheckinData | null
}

export function CheckinStatusWidget({ dictionary, locale, initialCheckin }: CheckinStatusProps) {
    const [checkin, setCheckin] = useState<CheckinData | null>(initialCheckin ?? null)
    const [isLoading, setIsLoading] = useState(!initialCheckin)

    useEffect(() => {
        // If the server already provided fresh state, skip the mount-time fetch.
        if (initialCheckin) return

        fetch('/api/checkin/confirm')
            .then(res => res.json())
            .then(data => setCheckin(data))
            .catch(err => console.error('Error fetching checkin status:', err))
            .finally(() => setIsLoading(false))
    }, [initialCheckin])

    if (isLoading) {
        return (
            <div className="p-4 bg-card border border-border rounded-xl animate-pulse">
                <div className="h-4 bg-secondary rounded w-1/2 mb-2" />
                <div className="h-6 bg-secondary rounded w-1/3" />
            </div>
        )
    }

    if (!checkin?.hasCheckin) {
        return null
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    return (
        <div className={`p-4 rounded-xl border ${checkin.isOverdue ? 'bg-error/10 border-error/30' : 'bg-card border-border'}`}>
            <h3 className="font-medium flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {dictionary.title}
            </h3>

            {checkin.isOverdue ? (
                <p className="text-sm text-error mt-1">{dictionary.overdue}</p>
            ) : (
                <p className="text-sm text-muted-foreground mt-1">
                    {dictionary.nextCheckin}: {formatDate(checkin.nextDueAt)}
                    <span className="ml-2">
                        ({checkin.daysRemaining} {dictionary.daysRemaining})
                    </span>
                </p>
            )}
        </div>
    )
}
