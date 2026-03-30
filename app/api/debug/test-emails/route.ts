import { NextRequest, NextResponse } from 'next/server';
import { getResend, DEFAULT_SENDER } from '@/lib/resend';
import { getDictionary } from '@/lib/i18n';
import {
    getMessageDeliveryTemplate,
    getTrustedContactVerifyTemplate,
    getTrustedContactInvitationTemplate,
    getResetPasswordTemplate,
    getPaymentFailedTemplate,
    getMessageSpecialTemplate,
    getMessagePosthumousTemplate,
    EmailDictionary
} from '@/lib/email-templates';
import { sendMagicLinkEmail } from '@/components/emails/magic-link-email';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const apiKey = process.env.RESEND_API_KEY;
    console.log('Final API Key check (masked):', apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}` : 'UNDEFINED');
    
    const targetEmail = 'danielfernandezesnal@gmail.com';
    const resend = getResend();
    const dict = await getDictionary('es') as unknown as EmailDictionary;
    
    const results: any[] = [];
    const dummyLink = 'https://carrymywords.com/auth/callback?token=abc';

    // Magic Link uses the React component system
    try {
        const { data, error } = await sendMagicLinkEmail(targetEmail, dummyLink, 'es', false);
        results.push({ name: 'Magic Link', success: !error, id: (data as any)?.id, error });
    } catch (e: any) {
        results.push({ name: 'Magic Link', success: false, error: e.message });
    }

    const templates = [
        {
            name: 'Reset Password',
            ...getResetPasswordTemplate(dict, { resetLink: dummyLink })
        },
        {
            name: 'Message Delivery',
            ...getMessageDeliveryTemplate(dict, { contentHtml: "<p>Contenido de prueba</p>", magicLink: dummyLink, senderName: "Juan Pérez" })
        },
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
            ...getPaymentFailedTemplate(dict)
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
    }

    return NextResponse.json({ success: true, results });
}
