import * as React from 'react';
import { getDictionary, Locale } from '@/lib/i18n';
import { getResend, DEFAULT_SENDER } from '@/lib/resend';
import { checkinReminderStyles } from './_shared/checkin-reminder-layout';
import { render } from '@react-email/render';

export interface TrustedContactNotificationEmailProps {
  senderName: string;
  verifyUrl: string;
  locale: Locale;
}

export async function TrustedContactNotificationEmail({
  senderName,
  verifyUrl,
  locale,
}: TrustedContactNotificationEmailProps) {
  const dict = await getDictionary(locale);
  const t = dict.emails.trustedContactNotify;
  const common = dict.emails.common;

  const subject = t.subject.replace('{senderName}', senderName);
  const introParagraphs = t.intro.replace('{senderName}', senderName).split('\n\n').filter(Boolean);

  return (
    <html lang={locale}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{subject}</title>
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
              {introParagraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
              <p>{t.body}</p>

              <a href={verifyUrl} className="btn-primary" style={{ marginTop: '24px' }}>
                {t.button}
              </a>
              <p style={{ fontSize: '13px', color: '#9B8B7E', textAlign: 'center', marginTop: '16px' }}>
                {t.secondary}
              </p>
            </div>
            <div className="sign-off">
              <hr />
              <p style={{ textAlign: 'center', color: '#9B8B7E' }}>{t.ignore}</p>

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
          </div>
        </div>
      </body>
    </html>
  );
}

export async function sendTrustedContactNotificationEmail(
  toEmail: string,
  senderName: string,
  verifyUrl: string,
  locale: Locale,
) {
  const resend = getResend();
  const dict = await getDictionary(locale);

  if (!resend) {
    console.error("Resend client not available");
    return { error: "Resend client not available" };
  }

  const subject = dict.emails.trustedContactNotify.subject.replace('{senderName}', senderName);

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_SENDER,
      to: toEmail,
      subject,
      html: await render(await TrustedContactNotificationEmail({ senderName, verifyUrl, locale })),
    });
    if (error) {
      console.error("Error sending Trusted Contact Notification email:", error);
      return { error };
    }
    return { data };
  } catch (error) {
    console.error("Error sending Trusted Contact Notification email:", error);
    return { error };
  }
}
