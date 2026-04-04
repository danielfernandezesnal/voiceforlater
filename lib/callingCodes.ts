import { COUNTRIES } from './countries'

// Derive CALLING_CODES from the main COUNTRIES list (dedup by dial code + country name)
export const CALLING_CODES = COUNTRIES.map(c => ({
    iso: c.code,
    country: c.nameES,
    dial: c.dialCode,
}))

/**
 * Parse a stored phone string like "+598 99 123 456" into { dialCode, localNumber }.
 * Falls back to +598 if no dial code detected.
 */
export function parsePhone(stored: string): { dialCode: string; localNumber: string } {
    if (!stored || !stored.startsWith('+')) {
        return { dialCode: '+598', localNumber: stored || '' }
    }

    // Try matching the longest dial code first (e.g. +598 before +5)
    const sorted = [...CALLING_CODES].sort((a, b) => b.dial.length - a.dial.length)
    for (const entry of sorted) {
        if (stored.startsWith(entry.dial)) {
            return {
                dialCode: entry.dial,
                localNumber: stored.slice(entry.dial.length).trim(),
            }
        }
    }

    return { dialCode: '+598', localNumber: stored }
}
