import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getResend } from '@/lib/resend';
import { ADMIN_EMAIL } from '@/lib/constants';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getResetPasswordTemplate, EmailDictionary } from '@/lib/email-templates';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { email, locale = 'es' } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Generate a Supabase recovery link (secure, expires in 1h)
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/auth/set-password`,
            },
        });

        if (linkError) {
            if (process.env.NODE_ENV !== 'production') console.error('Error generating reset link:', linkError);
            // Return success anyway to avoid email enumeration
            return NextResponse.json({ success: true });
        }

        const resetLink = linkData.properties.action_link;

        // 2. Send email with reset link
        const dict = await getDictionary(locale) as unknown as EmailDictionary;
        const { subject, html } = getResetPasswordTemplate(dict, { resetLink });

        const resend = getResend();
        const sender = 'Carry my Words <hola@carrymywords.com>'; // Standardized sender
        const recipientEmail = email === ADMIN_EMAIL ? 'danielfernandezesnal@gmail.com' : email;

        await resend.emails.send({
            from: sender,
            to: recipientEmail,
            subject,
            html
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

