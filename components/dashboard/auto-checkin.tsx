'use client'

import { useEffect } from 'react'

export function AutoCheckin() {
    useEffect(() => {
        // Silently confirm check-in on mount
        fetch('/api/checkin/confirm', { method: 'POST' })
            .catch(err => console.error('Silent check-in failed:', err))
    }, [])

    return null
}
