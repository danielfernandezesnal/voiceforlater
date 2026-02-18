
"use client";

import { useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const switchLocale = (newLocale: string) => {
        if (newLocale === currentLocale) return;

        // Optimistically update cookie and profile via API
        fetch('/api/locale', {
            method: 'POST',
            body: JSON.stringify({ locale: newLocale }),
            headers: { 'Content-Type': 'application/json' }
        }).then(() => {
            // After updating server state, navigate to new locale
            // We need to replace the locale segment in the path
            const segments = pathname.split('/');
            // segments[0] is empty, segments[1] is locale
            if (segments.length >= 2) {
                segments[1] = newLocale;
                const newPath = segments.join('/');

                startTransition(() => {
                    router.push(newPath);
                    router.refresh(); // Refresh to update server-side fetched data (profile)
                });
            }
        });
    };

    return (
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mr-4">
            <button
                onClick={() => switchLocale('en')}
                disabled={isPending}
                className={`hover:text-foreground transition-colors ${currentLocale === 'en' ? 'text-foreground font-bold' : ''}`}
            >
                EN
            </button>
            <span className="opacity-30">/</span>
            <button
                onClick={() => switchLocale('es')}
                disabled={isPending}
                className={`hover:text-foreground transition-colors ${currentLocale === 'es' ? 'text-foreground font-bold' : ''}`}
            >
                ES
            </button>
        </div>
    );
}
