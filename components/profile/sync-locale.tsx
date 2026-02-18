
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE } from "@/lib/i18n/locale";

function getCookie(name: string): string | undefined {
    // Basic cookie reader for client side
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
}

/**
 * Syncs the browser cookie (vfl_locale) with the authoritative profile locale.
 * If they differ, calls source-of-truth API to set cookie (and ensure DB is correct).
 */
export function LocaleSyncer({ locale }: { locale: string }) {
    const router = useRouter();

    useEffect(() => {
        const cookieLocale = getCookie(LOCALE_COOKIE);

        // If cookie is missing or different, sync it
        if (cookieLocale !== locale) {
            console.log(`[i18n] Syncing locale cookie (${cookieLocale}) to match profile (${locale})`);

            fetch('/api/locale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locale })
            })
                .then(res => {
                    if (!res.ok) console.error("Failed to sync locale");
                    // Cookie is set by response headers.
                    // We don't need to reload unless current URL locale is wrong, 
                    // but that is handled by DashboardLayout redirect.
                })
                .catch(err => console.error(err));
        }
    }, [locale]);

    return null;
}
