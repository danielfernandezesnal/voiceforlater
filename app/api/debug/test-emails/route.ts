import { NextRequest, NextResponse } from 'next/server';
import { getResend, DEFAULT_SENDER } from '@/lib/resend';
import { getDictionary } from '@/lib/i18n';
import {
    getTrustedContactVerifyTemplate,
    getTrustedContactInvitationTemplate,
    getPaymentFailedTemplate,
    getMessageSpecialTemplate,
    getMessagePosthumousTemplate,
    EmailDictionary
} from '@/lib/email-templates';
import { sendMagicLinkEmail } from '@/components/emails/magic-link-email';
import { sendResetPasswordEmail } from '@/components/emails/reset-password-email';
import { sendTrustedContactNotificationEmail } from '@/components/emails/trusted-contact-notification-email';
import { sendMessageDeliveryEmail } from '@/components/emails/message-delivery-email';
import { sendCheckinReminder1Email } from '@/components/emails/checkin-reminder-1-email';
import { sendCheckinReminder2Email } from '@/components/emails/checkin-reminder-2-email';
import { sendCheckinReminder3Email } from '@/components/emails/checkin-reminder-3-email';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('Authorization');
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    console.log('Final API Key check (masked):', apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}` : 'UNDEFINED');
    
    const targetEmail = 'danielfernandezesnal@gmail.com';
    const resend = getResend();
    const dict = await getDictionary('es') as unknown as EmailDictionary;
    
    const results: any[] = [];
    const dummyLink = 'https://carrymywords.com/auth/callback?token=abc';

    // React-based emails
    try {
        const { data, error } = await sendMagicLinkEmail(targetEmail, dummyLink, 'es', false);
        results.push({ name: 'Magic Link', success: !error, id: (data as any)?.id, error: error ? String((error as any)?.message || error) : null });
    } catch (e: any) {
        results.push({ name: 'Magic Link', success: false, error: e.message });
    }
    await sleep(300);

    try {
        const { data, error } = await sendResetPasswordEmail(targetEmail, dummyLink, 'es');
        results.push({ name: 'Reset Password', success: !error, id: (data as any)?.id, error: error ? String((error as any)?.message || error) : null });
    } catch (e: any) {
        results.push({ name: 'Reset Password', success: false, error: e.message });
    }
    await sleep(300);

    try {
        const { data, error } = await sendTrustedContactNotificationEmail(targetEmail, "Juan", dummyLink, 'es');
        results.push({ name: 'Trusted Contact Notification', success: !error, id: (data as any)?.id, error: error ? String((error as any)?.message || error) : null });
    } catch (e: any) {
        results.push({ name: 'Trusted Contact Notification', success: false, error: e.message });
    }
    await sleep(300);

    try {
        const { data, error } = await sendMessageDeliveryEmail(targetEmail, dummyLink, "Juan Pérez", "Juan", 'es');
        results.push({ name: 'Message Delivery', success: !error, id: (data as any)?.id, error: error ? String((error as any)?.message || error) : null });
    } catch (e: any) {
        results.push({ name: 'Message Delivery', success: false, error: e.message });
    }
    await sleep(300);

    try {
        const { data, error } = await sendCheckinReminder1Email(targetEmail, dummyLink, 'es');
        results.push({ name: 'Checkin Reminder 1', success: !error, id: (data as any)?.id, error: error ? String((error as any)?.message || error) : null });
    } catch (e: any) {
        results.push({ name: 'Checkin Reminder 1', success: false, error: e.message });
    }
    await sleep(300);

    try {
        const { data, error } = await sendCheckinReminder2Email(targetEmail, dummyLink, 'es');
        results.push({ name: 'Checkin Reminder 2', success: !error, id: (data as any)?.id, error: error ? String((error as any)?.message || error) : null });
    } catch (e: any) {
        results.push({ name: 'Checkin Reminder 2', success: false, error: e.message });
    }
    await sleep(300);

    try {
        const { data, error } = await sendCheckinReminder3Email(targetEmail, dummyLink, 'es');
        results.push({ name: 'Checkin Reminder 3', success: !error, id: (data as any)?.id, error: error ? String((error as any)?.message || error) : null });
    } catch (e: any) {
        results.push({ name: 'Checkin Reminder 3', success: false, error: e.message });
    }
    await sleep(300);

    const templates = [
        {
            name: 'Trusted Contact Verify',
            ...getTrustedContactVerifyTemplate(dict, { contactFirstName: "María", senderFirstName: "Daniel", verifyUrl: dummyLink })
        },
        {
            name: 'Trusted Contact Invitation',
            ...getTrustedContactInvitationTemplate(dict, { 
                contactFirstName: "Daniel", 
                senderFullName: "Juan Pérez", 
                senderFirstName: "Juan" 
            })
        },
        {
            name: 'Payment Failed',
            ...getPaymentFailedTemplate(dict, { dashboardUrl: 'https://carrymywords.com/es/dashboard' })
        },
        {
            name: 'Special Message',
            ...getMessageSpecialTemplate(dict, { 
                recipientName: "Daniel", 
                senderName: "Juan Pérez", 
                messageUrl: dummyLink 
            })
        },
        {
            name: 'Posthumous Message',
            ...getMessagePosthumousTemplate(dict, { 
                recipientName: "Daniel", 
                senderName: "Juan Pérez", 
                messageUrl: dummyLink 
            })
        }
    ];

    for (const t of templates) {
        try {
            const { data, error } = await resend.emails.send({
                from: DEFAULT_SENDER,
                to: targetEmail,
                subject: `[TEST] ${t.name}: ${t.subject}`,
                html: t.html
            });
            results.push({ name: t.name, success: !error, id: data?.id, error });
        } catch (e: any) {
            results.push({ name: t.name, success: false, error: e.message });
        }
        await sleep(300);
    }

    return NextResponse.json({ success: true, results });
}
