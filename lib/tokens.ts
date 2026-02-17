
import crypto from 'crypto';

/**
 * Generates a random secure token for one-time verification.
 * Returns both the base64-safe URL-friendly raw token and its hex hash.
 */
export function generateVerificationToken() {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    return {
        rawToken, // Send this to the user via email
        tokenHash // Store this in the database
    };
}

/**
 * Verifies if a given raw token matches the stored hash
 */
export function verifyToken(rawToken: string, storedHash: string) {
    const incomingHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return incomingHash === storedHash;
}
