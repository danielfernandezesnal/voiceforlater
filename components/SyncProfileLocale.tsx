
'use client';

import { useEffect } from 'react';

export function SyncProfileLocale({ locale }: { locale: string }) {
    useEffect(() => {
        // Sync locale to profile if authenticated. 
        // We do this optimistically and silently.
        // We only support 'en' and 'es' for now.
        if (['en', 'es'].includes(locale)) {
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
