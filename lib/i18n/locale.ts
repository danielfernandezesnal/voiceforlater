
import { NextRequest } from "next/server";
import { defaultLocale, isValidLocale, type Locale } from './config';

export { isValidLocale, type Locale, defaultLocale };

export const LOCALE_COOKIE = 'vfl_locale';

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
        // Simple parse: take first valid locale found (full tag first, then base tag)
        const preferred = acceptLanguage.split(',').map(lang => {
            const [l] = lang.split(';');
            return l.trim(); // e.g. "en-US", "es", "pt-BR"
        });

        for (const lang of preferred) {
            // Check exact match first (important for tags like "pt-BR" once supported)
            if (isValidLocale(lang)) {
                return lang;
            }
            // Fall back to base language tag (e.g. "en-US" -> "en")
            const base = lang.split('-')[0];
            if (isValidLocale(base)) {
                return base;
            }
        }
    }

    // 3. Default
    return defaultLocale;
}
