import * as React from 'react';
import { getDictionary, Locale } from '@/lib/i18n';
import { getResend, DEFAULT_SENDER } from '@/lib/resend';
import { checkinReminderStyles } from './_shared/checkin-reminder-layout';
import { render } from '@react-email/render';

export interface ResetPasswordEmailProps {
  resetLink: string;
  locale: Locale;
}

export async function ResetPasswordEmail({
  resetLink,
  locale,
}: ResetPasswordEmailProps) {
  const dict = await getDictionary(locale);
  const t = dict.emails.resetPassword;
  const common = dict.emails.common;
  const titleLines = t.title.split('\n');

  const styles = checkinReminderStyles + `
    body { background-color: #f5f0e8; }
    .email-wrapper { max-width: 580px; }
    .top-header { text-align: center; margin-bottom: 32px; }
    .logo-title { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 24px; font-weight: 400; color: #C4623A; margin-bottom: 5px; }
    .logo-subtitle { font-family: 'Inter', sans-serif; font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase; color: #C4623A; font-weight: 500; }
    .card { background: #fffdf9; border-radius: 4px; border: 1px solid #e8e0d0; box-shadow: none; }
    .eyebrow { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #c4622a; font-weight: 500; margin-bottom: 16px; }
    .hero { background: #fffdf9; padding: 48px 48px 0; }
    .hero h1 { font-family: 'Lora', Georgia, serif; font-size: 38px; font-weight: 400; color: #1a0e09; line-height: 1.18; margin: 0; }
    .hero h1 em { font-style: italic; color: #c4622a; }
    .ornament { display: flex; align-items: center; gap: 12px; padding: 28px 48px; }
    .ornament-line { flex: 1; height: 1px; background: #ddd0bc; }
    .ornament-glyph { font-family: 'Lora', serif; font-size: 14px; color: #c4622a; opacity: 0.55; }
    .body { padding: 0 48px 40px; }
    .body p { font-size: 14px; line-height: 1.78; color: #4a3728; font-weight: 300; margin-bottom: 28px; }
    .btn-primary { background: #c4622a; color: #fff9f4 !important; border-radius: 2px; padding: 16px 44px; font-size: 12px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; display: inline-block; }
    .cta-hint { font-size: 11px; color: #a08878; margin-top: 12px; font-weight: 300; }
    .footer { background: #f5efe3; border-top: 1px solid #ecdfd0; padding: 24px 48px; text-align: left; }
    .footer-ignore { font-size: 11px; color: #b8a898; margin-top: 0; font-weight: 300; }
    @media only screen and (max-width: 600px) {
      .hero { padding: 36px 28px 0 !important; }
      .hero h1 { font-size: 28px !important; }
      .ornament { padding: 20px 28px !important; }
      .body { padding: 0 28px 28px !important; }
      .footer { padding: 20px 28px !important; }
    }
  `;

  return (
    <html lang={locale}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{t.subject}</title>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
      </head>
      <body>
        <div className="email-wrapper">

          {/* LOGO */}
          <div className="top-header">
            <a href="https://voiceforlater.vercel.app" style={{ display: 'inline-block', textDecoration: 'none' }}>
              <img
                src="https://voiceforlater.vercel.app/assets/logo-email.png"
                alt="Carry my Words"
                width="420"
                style={{ display: 'block', margin: '0 auto' }}
              />
            </a>
          </div>

          <div className="card">

            {/* HERO */}
            <div className="hero">
              <div className="eyebrow">{t.eyebrow}</div>
              <h1>
                {titleLines[0]}<br />
                <em>{titleLines[1]}</em>
              </h1>
            </div>

            {/* SEPARADOR */}
            <div className="ornament">
              <div className="ornament-line" />
              <span className="ornament-glyph">◆</span>
              <div className="ornament-line" />
            </div>

            {/* BODY */}
            <div className="body">
              <p>{t.intro}</p>
              <a href={resetLink} className="btn-primary">
                {t.cta}
              </a>
              <p className="cta-hint">{t.securityNote}</p>
            </div>

          </div>

          {/* FOOTER */}
          <div className="footer">
            <p className="footer-ignore">{t.securityNote}</p>
          </div>

        </div>
      </body>
    </html>
  );
}

export async function sendResetPasswordEmail(toEmail: string, resetLink: string, locale: Locale) {
  const resend = getResend();
  const dict = await getDictionary(locale);

  if (!resend) {
    console.error("Resend client not available");
    return { error: "Resend client not available" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_SENDER,
      to: toEmail,
      subject: dict.emails.resetPassword.subject,
      html: await render(await ResetPasswordEmail({ resetLink, locale })),
    });
    if (error) {
      console.error("Error sending Reset Password email:", error);
      return { error };
    }
    return { data };
  } catch (error) {
    console.error("Error sending Reset Password email:", error);
    return { error };
  }
}
