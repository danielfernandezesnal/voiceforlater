"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
    const pathname = usePathname();

    const getPathForLocale = (newLocale: string) => {
        const segments = pathname.split('/');
        // segments[0] is empty, segments[1] is current locale
        if (segments.length >= 2) {
            segments[1] = newLocale;
            return segments.join('/');
        }
        return `/${newLocale}`;
    };

    return (
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mr-4">
            <Link
                href={getPathForLocale('en')}
                className={`hover:text-foreground transition-colors ${currentLocale === 'en' ? 'text-foreground font-bold underline underline-offset-4 decoration-accent/40' : ''}`}
            >
                EN
            </Link>
            <span className="opacity-30">/</span>
            <Link
                href={getPathForLocale('es')}
                className={`hover:text-foreground transition-colors ${currentLocale === 'es' ? 'text-foreground font-bold underline underline-offset-4 decoration-accent/40' : ''}`}
            >
                ES
            </Link>
        </div>
    );
}
