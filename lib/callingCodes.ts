export const CALLING_CODES = [
    { iso: "UY", country: "Uruguay", dial: "+598" },
    { iso: "AR", country: "Argentina", dial: "+54" },
    { iso: "BR", country: "Brasil", dial: "+55" },
    { iso: "CL", country: "Chile", dial: "+56" },
    { iso: "PY", country: "Paraguay", dial: "+595" },
    { iso: "US", country: "Estados Unidos", dial: "+1" },
    { iso: "ES", country: "España", dial: "+34" },
    { iso: "IT", country: "Italia", dial: "+39" },
    { iso: "FR", country: "Francia", dial: "+33" },
    { iso: "DE", country: "Alemania", dial: "+49" },
]

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
