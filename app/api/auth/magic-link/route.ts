import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getResend } from '@/lib/resend';

export const dynamic = 'force-dynamic';

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

    // Send email via Resend
    const resend = getResend();
    // TODO: Change this to your verified domain, e.g. 'noreply@voiceforlater.com'
    // If testing with 'onboarding@resend.dev', you can only send to your own email.
    const sender = process.env.RESEND_FROM_EMAIL || 'VoiceForLater <onboarding@resend.dev>';

    const { error: emailError } = await resend.emails.send({
      from: sender,
      to: email,
      subject: locale === 'es' ? 'Tu enlace de acceso a VoiceForLater' : 'Your VoiceForLater Login Link',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #6366f1;">VoiceForLater</h2>
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
      `,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      // Return detailed error for debugging
      return NextResponse.json({
        error: 'Could not send email',
        details: emailError
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Magic link route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
