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

  return (
    <html lang={locale}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{t.subject}</title>
        <style dangerouslySetInnerHTML={{ __html: checkinReminderStyles }} />
      </head>
      <body>
        <div className="email-wrapper">
          <div className="top-header">
            <div className="logo-title">{common.footerSignature}</div>
            <div className="logo-subtitle">{common.tagline}</div>
          </div>
          <div className="card">
            <div className="hero">
              <p style={{ margin: '0 0 8px', fontSize: '11px', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                {t.eyebrow}
              </p>
              <h1>{t.title}</h1>
            </div>
            <div className="body">
              <p>{t.intro}</p>
              <a href={resetLink} className="btn-primary" style={{ marginTop: '8px' }}>
                {t.cta}
              </a>
              <p style={{ fontSize: '13px', color: '#9B8B7E', textAlign: 'center', marginTop: '16px' }}>
                {t.securityNote}
              </p>
            </div>
            <div className="sign-off">
              <hr />
              <div style={{ height: '1px', background: '#EAE4D9', margin: '24px 0' }}></div>
              <p style={{ margin: 0, fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: '14px', color: '#C4623A', textAlign: 'center' }}>
                {t.tagline}
              </p>
            </div>
          </div>
          <div className="footer">
            <div className="footer-logo" style={{ marginBottom: '8px' }}>{common.footerSignature}</div>
            <p>
              <a href="https://carrymywords.com" style={{ color: '#8a7a6a', textDecoration: 'none' }}>
                {common.externalFooter}
              </a>
            </p>
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
