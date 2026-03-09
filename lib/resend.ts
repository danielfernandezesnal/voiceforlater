import { Resend } from 'resend';

let resendInstance: Resend | null = null;

export function getResend() {
    if (!resendInstance) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey && process.env.NODE_ENV === 'production') {
            console.error('RESEND_API_KEY is missing');
        }
        // We pass an empty string if missing to avoid constructor throw during build
        resendInstance = new Resend(apiKey || 're_placeholder');
    }
    return resendInstance;
}

export function getDefaultSender() {
    const resendFromEnv = process.env.RESEND_FROM_EMAIL;
    if (!resendFromEnv) {
        // Fallback to Resend's default onboarding email but with our branding if allowed
        // Note: Resend is very strict with onboarding@resend.dev, sometimes display name works, sometimes not.
        return "Carry My Words <onboarding@resend.dev>";
    }

    // Use the ENV value but ensure the display name is 'Carry My Words'
    if (resendFromEnv.includes('<')) {
        return resendFromEnv.replace(/^[^<]+(?=<)/, 'Carry My Words ');
    }

    return `Carry My Words <${resendFromEnv}>`;
}

export const DEFAULT_SENDER = getDefaultSender();
