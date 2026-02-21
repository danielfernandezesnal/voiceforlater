import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getResend } from '@/lib/resend';
import { trackEmail } from '@/lib/email-tracking';
import { getDictionary, Locale } from '@/lib/i18n';
import { getMagicLinkTemplate } from '@/lib/email-templates';

export const dynamic = 'force-dynamic';

import { ADMIN_EMAIL } from "@/lib/constants";
const ADMIN_OWNER_EMAIL = 'danielfernandezesnal@gmail.com';

export async function POST(request: NextRequest) {
  try {
    const { email, locale } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Use Service Role to generate the link
    const supabase = createAdminClient();

    // Determine the origin for redirection
    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectTo = `${origin.replace(/\/$/, '')}/${locale || 'en'}/auth/callback`;

    const { data, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo,
      },
    });

    if (linkError || !data?.properties) {
      console.error('Error generating link:', linkError);
      return NextResponse.json({ error: 'Could not generate magic link', details: linkError?.message }, { status: 500 });
    }

    const { properties } = data;
    const tokenHash = properties.hashed_token;

    // Construct our own direct callback link to avoid Supabase's implicit flow redirect
    const magicLink = `${origin.replace(/\/$/, '')}/${locale || 'en'}/auth/callback?token_hash=${tokenHash}&type=magiclink`;

    // Determine recipient email (admin redirect)
    const isAdminLogin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const recipientEmail = isAdminLogin ? ADMIN_OWNER_EMAIL : email;

    // Send email via Resend
    const resend = getResend();
    const sender = process.env.RESEND_FROM_EMAIL || 'Carry My Words <onboarding@resend.dev>';

    const dict = await getDictionary((locale || 'en') as Locale);
    const { subject: emailSubject, html: emailBody } = getMagicLinkTemplate(dict as any, { magicLink, isAdminLogin });

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: sender,
      to: recipientEmail,
      subject: emailSubject,
      html: emailBody,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);

      // Track failed email
      await trackEmail({
        userId: data.user?.id,
        toEmail: recipientEmail,
        emailType: 'magic_link',
        status: 'failed',
        errorMessage: emailError.message || 'Unknown error',
      });

      return NextResponse.json({
        error: 'Could not send email',
        details: emailError
      }, { status: 500 });
    }

    // Track successful email
    await trackEmail({
      userId: data.user?.id,
      toEmail: recipientEmail,
      emailType: 'magic_link',
      providerMessageId: emailData?.id,
      status: 'sent',
    });

    return NextResponse.json({
      success: true,
      ...(isAdminLogin && { message: 'Confirmation sent to admin owner' })
    });
  } catch (error) {
    console.error('Magic link route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
