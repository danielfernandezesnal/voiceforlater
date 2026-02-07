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
