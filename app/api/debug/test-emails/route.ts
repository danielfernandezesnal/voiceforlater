import { NextRequest, NextResponse } from 'next/server';
import { getResend, DEFAULT_SENDER } from '@/lib/resend';
import { getDictionary } from '@/lib/i18n';
import { 
    getMagicLinkTemplate, 
    getMessageDeliveryTemplate, 
    getCheckinReminderTemplate, 
    getTrustedContactVerifyTemplate, 
    getTrustedContactInvitationTemplate,
    getResetPasswordTemplate,
    getPaymentFailedTemplate,
    getMessageSpecialTemplate,
    getMessagePosthumousTemplate,
    EmailDictionary
} from '@/lib/email-templates';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const apiKey = process.env.RESEND_API_KEY;
    console.log('Final API Key check (masked):', apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}` : 'UNDEFINED');
    
    const targetEmail = 'danielfernandezesnal@gmail.com';
    const resend = getResend();
    const dict = await getDictionary('es') as unknown as EmailDictionary;
    
    const results: any[] = [];
    const dummyLink = 'https://carrymywords.com/auth/callback?token=abc';

    const templates = [
        {
            name: 'Magic Link',
            ...getMagicLinkTemplate(dict, { magicLink: dummyLink, isAdminLogin: false })
        },
        {
            name: 'Reset Password',
            ...getResetPasswordTemplate(dict, { password: "DUMMY_PASSWORD_123" })
        },
        {
            name: 'Message Delivery',
            ...getMessageDeliveryTemplate(dict, { contentHtml: "<p>Contenido de prueba</p>", magicLink: dummyLink, senderName: "Juan Pérez" })
        },
        {
            name: 'Check-in Reminder',
            ...getCheckinReminderTemplate(dict, { attempts: 1, confirmUrl: 'https://carrymywords.com/confirmar-actividad' })
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
            ...getPaymentFailedTemplate(dict, { planStatus: "Past Due" })
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
