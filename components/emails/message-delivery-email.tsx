import * as React from 'react';
import { getDictionary, Locale } from '@/lib/i18n';
import { getResend } from '@/lib/resend';
import { checkinReminderStyles } from './_shared/checkin-reminder-layout';
import { render } from '@react-email/render';

export interface MessageDeliveryEmailProps {
  magicLink: string;
  senderName: string;
  senderFirstName: string;
  locale: Locale;
}

export async function MessageDeliveryEmail({
  magicLink,
  senderName,
  senderFirstName,
  locale,
}: MessageDeliveryEmailProps) {
  const dict = await getDictionary(locale);
  const t = dict.emails.messageDelivery;
  const common = dict.emails.common;
  const subject = t.ctaSubject.replace('{senderName}', senderName);

  // Inline styles to extend checkinReminderStyles with message-delivery-specific overrides
  const extraStyles = `
    .hero h1 { font-size: 24px; }
    .content-hidden-block {
      background: #f5f0e8;
      border-radius: 12px;
      padding: 28px 32px;
      text-align: center;
      font-family: 'Lora', serif;
      color: #6b5e52;
      font-style: italic;
      font-size: 1.05rem;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .link-valid { text-align: center; font-size: 12px; color: #9B8B7E; margin-top: 16px; }
  `;

  return (
    <html lang={locale}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{subject}</title>
        <style dangerouslySetInnerHTML={{ __html: checkinReminderStyles + extraStyles }} />
      </head>
      <body>
        <div className="email-wrapper">
          <div className="top-header">
            <div className="logo-title">{common.footerSignature}</div>
            <div className="logo-subtitle">{common.tagline}</div>
          </div>
          <div className="card">
            <div className="hero">
              <h1>{subject}</h1>
            </div>
            <div className="body">
              <p>{t.ctaIntro}</p>

              {/* Sealed content block — intentionally does not show message content */}
              <div className="content-hidden-block"
                dangerouslySetInnerHTML={{ __html: t.contentHidden }}
              />

              <a href={magicLink} className="btn-primary" style={{ marginTop: '8px' }}>
                {t.ctaButton}
              </a>
              <p className="link-valid">{t.linkValid}</p>
            </div>
            <div className="sign-off">
              <hr />
              <p style={{ textAlign: 'center', fontSize: '12px', color: '#9B8B7E' }}>
                {t.footer}
              </p>
              <p className="firma" style={{ textAlign: 'center', marginTop: '8px' }}>
                — {common.footerSignature}
              </p>
              <div style={{ height: '1px', background: '#EAE4D9', margin: '24px 0' }}></div>
              <p style={{ margin: 0, fontFamily: "'Lora', serif", fontStyle: 'italic', fontSize: '14px', color: '#C4623A', textAlign: 'center' }}>
                {common.tagline}
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

/**
 * Sends the Message Delivery notification email to a recipient.
 *
 * Note: `senderName` is used in the email subject ({senderName} interpolation).
 * `senderFirstName` is used in the Resend "from" field only.
 * The actual message content is NEVER included in the email — by design.
 * Recipients must click the magicLink to log in and read their message.
 */
export async function sendMessageDeliveryEmail(
  toEmail: string,
  magicLink: string,
  senderName: string,
  senderFirstName: string,
  locale: Locale,
) {
  const resend = getResend();
  const dict = await getDictionary(locale);

  if (!resend) {
    console.error("Resend client not available");
    return { error: "Resend client not available" };
  }

  const subject = dict.emails.messageDelivery.ctaSubject.replace('{senderName}', senderName);

  try {
    const { data, error } = await resend.emails.send({
      from: `${senderFirstName} via Carry my Words <no-reply@voiceforlater.com>`,
      to: toEmail,
      subject,
      html: await render(await MessageDeliveryEmail({ magicLink, senderName, senderFirstName, locale })),
    });
    if (error) {
      console.error("Error sending Message Delivery email:", error);
      return { error };
    }
    return { data };
  } catch (error) {
    console.error("Error sending Message Delivery email:", error);
    return { error };
  }
}
