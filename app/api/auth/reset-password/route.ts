import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ADMIN_EMAIL } from '@/lib/constants';
import { Locale } from '@/lib/i18n';
import { sendResetPasswordEmail } from '@/components/emails/reset-password-email';

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
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/auth/set-password`,
            },
        });

        if (linkError) {
            if (process.env.NODE_ENV !== 'production') console.error('Error generating reset link:', linkError);
            // Return success anyway to avoid email enumeration
            return NextResponse.json({ success: true });
        }

        const resetLink = linkData.properties.action_link;

        // 2. Send email with reset link
        const recipientEmail = email === ADMIN_EMAIL ? 'danielfernandezesnal@gmail.com' : email;
        await sendResetPasswordEmail(recipientEmail, resetLink, locale as Locale);

        return NextResponse.json({ success: true });

    } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

