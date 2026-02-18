import { NextRequest, NextResponse } from 'next/server';
import { getDictionary, Locale } from '@/lib/i18n';
import { getResend } from '@/lib/resend';
import {
    getMagicLinkTemplate,
    getMessageDeliveryTemplate,
    getCheckinReminderTemplate,
    getTrustedContactVerifyTemplate,
    EmailDictionary
} from '@/lib/email-templates';

export async function POST(request: NextRequest) {
    // 1. Production security guard
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    // 2. Debug token guard
    const debugToken = process.env.DEBUG_EMAIL_TOKEN;
    const requestToken = request.headers.get('x-debug-token');

    if (!debugToken) {
        return NextResponse.json({
            error: 'Configuration Error',
            message: 'DEBUG_EMAIL_TOKEN is not set in environment.'
        }, { status: 500 });
    }

    if (requestToken !== debugToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { toEmail, locale = 'en' } = await request.json();

        if (!toEmail) {
            return NextResponse.json({ error: 'toEmail is required' }, { status: 400 });
        }

        const dict = await getDictionary(locale as Locale);
        const resend = getResend();

        console.log(`Sending debug emails to ${toEmail} in ${locale}...`);

        // 1. Magic Link
        const ml = getMagicLinkTemplate(dict as any as EmailDictionary, {
            magicLink: 'https://voiceforlater.com/test-link',
            isAdminLogin: false
        });
        await resend.emails.send({
            from: 'VoiceForLater Debug <onboarding@resend.dev>',
            to: toEmail,
            subject: `[DEBUG] Magic Link (${locale}) - ${ml.subject}`,
            html: ml.html
        });

        // 2. Message Delivery
        const md = getMessageDeliveryTemplate(dict as any as EmailDictionary, {
            contentHtml: '<div style="background:#f0f0f0;padding:10px;">This is a test message content in English. Esta es una prueba en Español.</div>'
        });
        await resend.emails.send({
            from: 'VoiceForLater Debug <onboarding@resend.dev>',
            to: toEmail,
            subject: `[DEBUG] Message Delivery (${locale}) - ${md.subject}`,
            html: md.html
        });

        // 3. Check-in Reminder
        const cr = getCheckinReminderTemplate(dict as any as EmailDictionary, {
            attempts: 1,
            confirmUrl: 'https://voiceforlater.com/confirm'
        });
        await resend.emails.send({
            from: 'VoiceForLater Debug <onboarding@resend.dev>',
            to: toEmail,
            subject: `[DEBUG] Check-in Reminder (${locale}) - ${cr.subject}`,
            html: cr.html
        });

        // 4. Trusted Contact Verify
        const tcv = getTrustedContactVerifyTemplate(dict as any as EmailDictionary, {
            name: 'John Doe',
            userEmail: 'sender@example.com',
            verifyUrl: 'https://voiceforlater.com/verify'
        });
        await resend.emails.send({
            from: 'VoiceForLater Debug <onboarding@resend.dev>',
            to: toEmail,
            subject: `[DEBUG] Trusted Contact Verify (${locale}) - ${tcv.subject}`,
            html: tcv.html
        });

        return NextResponse.json({
            success: true,
            message: `Sent 4 debug emails to ${toEmail} using locale ${locale}`
        });
    } catch (error) {
        console.error('Email test error:', error);
        return NextResponse.json({ error: 'Internal Error', details: String(error) }, { status: 500 });
    }
}
