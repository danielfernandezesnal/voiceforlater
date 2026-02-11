import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getResend } from '@/lib/resend';
import { trackEmail } from '@/lib/email-tracking';

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
    const sender = process.env.RESEND_FROM_EMAIL || 'VoiceForLater <onboarding@resend.dev>';

    const emailSubject = locale === 'es'
      ? (isAdminLogin ? 'Acceso de administrador - VoiceForLater' : 'Tu enlace de acceso a VoiceForLater')
      : (isAdminLogin ? 'Admin Access - VoiceForLater' : 'Your VoiceForLater Login Link');

    const emailBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #6366f1;">VoiceForLater</h2>
        ${isAdminLogin ? `<p style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 10px 0;"><strong>${locale === 'es' ? 'Acceso de administrador' : 'Admin Access'}</strong></p>` : ''}
        <p>${locale === 'es' ? 'Hacé clic en el siguiente botón para entrar a tu cuenta:' : 'Click the button below to sign in to your account:'}</p>
        <div style="margin: 30px 0;">
          <a href="${magicLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            ${locale === 'es' ? 'Entrar ahora' : 'Sign In Now'}
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          ${locale === 'es' ? 'Si no solicitaste este enlace, podés ignorar este correo.' : "If you didn't request this link, you can safely ignore this email."}
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">
          ${magicLink}
        </p>
      </div>
    `;

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
