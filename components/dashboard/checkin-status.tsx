'use client'

import { useState, useEffect } from 'react'

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
}

interface CheckinData {
    hasCheckin: boolean
    status: string
    nextDueAt: string
    daysRemaining: number
    isOverdue: boolean
}

export function CheckinStatusWidget({ dictionary }: CheckinStatusProps) {
    const [checkin, setCheckin] = useState<CheckinData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetch('/api/checkin/confirm')
            .then(res => res.json())
            .then(data => setCheckin(data))
            .catch(err => console.error('Error fetching checkin status:', err))
            .finally(() => setIsLoading(false))
    }, [])

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
        return new Date(dateString).toLocaleDateString(undefined, {
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
