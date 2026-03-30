import * as React from 'react';
import { getDictionary, Locale } from '@/lib/i18n';
import { getResend, DEFAULT_SENDER } from '@/lib/resend';
import { checkinReminderStyles } from './_shared/checkin-reminder-layout';
import { render } from '@react-email/render';

export interface MagicLinkEmailProps {
  magicLink: string;
  locale: Locale;
  isAdminLogin: boolean;
}

export async function MagicLinkEmail({
  magicLink,
  locale,
  isAdminLogin,
}: MagicLinkEmailProps) {
  const dict = await getDictionary(locale);
  const t = dict.emails.magicLink;
  const common = dict.emails.common;

  const introParagraphs = t.intro.split('\n\n').filter(Boolean);

  return (
    <html lang={locale}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{isAdminLogin ? t.subjectAdmin : t.subject}</title>
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
              <h1>{t.title}</h1>
            </div>
            <div className="body">
              {isAdminLogin && (
                <div style={{
                  background: '#fef3c7',
                  borderLeft: '4px solid #f59e0b',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  borderRadius: '0 8px 8px 0',
                  fontSize: '14px',
                  color: '#92400e',
                }}>
                  <strong>{t.adminBadge}</strong>
                </div>
              )}
              {introParagraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
              <a href={magicLink} className="btn-primary" style={{ marginTop: '24px' }}>
                {t.button}
              </a>
              <p style={{ fontSize: '13px', color: '#9B8B7E', textAlign: 'center', marginTop: '16px' }}>
                {t.secondary}
              </p>
            </div>
            <div className="sign-off">
              <hr />
              <p>{t.ignore}</p>

              <div style={{ height: '1px', background: '#EAE4D9', margin: '24px 0' }}></div>
              <p style={{ margin: 0, fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: '14px', color: '#C4623A', textAlign: 'center' }}>
                {t.tagline}
              </p>
            </div>
          </div>
          <div className="footer">
            <div className="footer-logo" style={{ marginBottom: '8px' }}>{common.footerSignature}</div>
            <p style={{ marginBottom: '8px' }}>
              <a href="https://carrymywords.com" style={{ color: '#8a7a6a', textDecoration: 'none' }}>
                {common.externalFooter}
              </a>
            </p>
            <p style={{ marginTop: '12px' }}>
              {t.linkFallback}<br />
              <a href={magicLink} style={{ color: '#8a7a6a', wordBreak: 'break-all' }}>{magicLink}</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

export async function sendMagicLinkEmail(
  toEmail: string,
  magicLink: string,
  locale: Locale,
  isAdminLogin: boolean,
) {
  const resend = getResend();
  const dict = await getDictionary(locale);

  if (!resend) {
    console.error("Resend client not available");
    return { error: "Resend client not available" };
  }

  const subject = isAdminLogin
    ? dict.emails.magicLink.subjectAdmin
    : dict.emails.magicLink.subject;

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_SENDER,
      to: toEmail,
      subject,
      html: await render(await MagicLinkEmail({ magicLink, locale, isAdminLogin })),
    });
    if (error) {
      console.error("Error sending Magic Link email:", error);
      return { error };
    }
    return { data };
  } catch (error) {
    console.error("Error sending Magic Link email:", error);
    return { error };
  }
}
