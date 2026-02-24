/**
 * Safely extract an error message from an unknown caught value.
 * Works with Error instances, Supabase/Postgres errors ({ message, code }), and strings.
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
    ) {
        return (error as { message: string }).message;
    }
    if (typeof error === 'string') return error;
    return 'Unknown error';
}

/**
 * Check if an unknown error has a specific `code` property (e.g., Postgres error codes).
 */
export function hasErrorCode(error: unknown, code: string): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: unknown }).code === code
    );
}
