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

  const magicLinkStyles = checkinReminderStyles + `
    .email-wrapper { max-width: 580px; }
    .top-header { margin-bottom: 44px; }
    .logo-title { font-size: 28px; letter-spacing: -0.01em; margin-bottom: 6px; }
    .logo-subtitle { font-size: 10px; letter-spacing: 0.12em; opacity: 0.75; }
    .card { box-shadow: 0 4px 32px rgba(42,24,10,0.10); }
    .hero { background: linear-gradient(158deg, #a84e20 0%, #c96a32 100%); padding: 28px 56px 72px; }
    .hero h1 { font-size: 29px; font-weight: 600; line-height: 1.35; letter-spacing: -0.02em; max-width: 78%; }
    .body { padding: 44px 56px 40px; }
    .body p { line-height: 1.8; margin-bottom: 28px; }
    hr { margin: 32px 0; border-top-color: #ede8e0; }
    .btn-primary { background: linear-gradient(135deg, #a84e20 0%, #c96a32 100%); padding: 18px 48px; border-radius: 100px; font-size: 15px; letter-spacing: 0.03em; margin-bottom: 0; }
    .sign-off { padding: 0 56px 52px; }
    .footer p { font-size: 11px; }
  `;

  return (
    <html lang={locale}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{isAdminLogin ? t.subjectAdmin : t.subject}</title>
        <style dangerouslySetInnerHTML={{ __html: magicLinkStyles }} />
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
                  borderLeft: '3px solid #f59e0b',
                  padding: '14px 20px',
                  marginBottom: '32px',
                  borderRadius: '0 10px 10px 0',
                  fontSize: '13px',
                  color: '#92400e',
                }}>
                  <strong>{t.adminBadge}</strong>
                </div>
              )}
              {introParagraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
              <a href={magicLink} className="btn-primary" style={{ marginTop: '32px' }}>
                {t.button}
              </a>
              <p style={{ fontSize: '12px', color: '#9B8B7E', textAlign: 'center', marginTop: '20px' }}>
                {t.secondary}
              </p>
            </div>
            <div className="sign-off">
              <hr />
              <p>{t.ignore}</p>
              <p style={{ margin: '32px 0 0', fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: '14px', color: '#C4623A', textAlign: 'center' }}>
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
            <p style={{ marginTop: '20px', opacity: 0.75 }}>
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
