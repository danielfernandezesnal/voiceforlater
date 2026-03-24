
'use client';

import { useEffect } from 'react';
import { isValidLocale } from '@/lib/i18n';

export function SyncProfileLocale({ locale }: { locale: string }) {
    useEffect(() => {
        // Sync locale to profile if authenticated.
        // We do this optimistically and silently.
        if (isValidLocale(locale)) {
            fetch('/api/profile/locale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locale })
            }).catch(() => {
                // Ignore errors (e.g. unauthenticated)
            });
        }
    }, [locale]);

    return null;
}
