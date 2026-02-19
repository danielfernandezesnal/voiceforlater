
import { NextRequest } from "next/server";

export const LOCALES = ['en', 'es'] as const;
export type Locale = typeof LOCALES[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'vfl_locale';

export function isValidLocale(locale: string): locale is Locale {
    return LOCALES.includes(locale as any);
}

/**
 * Resolve locale from request (Cookie > Accept-Language > Default)
 */
export function resolveLocale(request: NextRequest): Locale {
    // 1. Check Cookie
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    if (cookieLocale && isValidLocale(cookieLocale)) {
        return cookieLocale;
    }

    // 2. Check Accept-Language
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
        // Simple parse: take first valid language found
        const preferred = acceptLanguage.split(',').map(lang => {
            const [l] = lang.split(';');
            return l.trim().split('-')[0]; // e.g. "en-US" -> "en"
        });

        for (const lang of preferred) {
            if (isValidLocale(lang)) {
                return lang;
            }
        }
    }

    // 3. Default
    return DEFAULT_LOCALE;
}
