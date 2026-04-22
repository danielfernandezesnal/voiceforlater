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
  const titleLine2 = locale === 'es' ? 'te dejó algo <em>especial.</em>' : 'left you something <em>special.</em>';

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
    .body p { font-size: 14px; line-height: 1.78; color: #4a3728; font-weight: 300; margin-bottom: 24px; }
    .sealed-block { background: #f5efe3; border: 1px solid #e8d8c4; border-radius: 4px; padding: 28px 32px; text-align: center; margin-bottom: 28px; }
    .sealed-icon { font-size: 18px; color: #c4622a; opacity: 0.7; margin-bottom: 12px; }
    .sealed-text { font-family: 'Lora', Georgia, serif; font-style: italic; font-size: 16px; color: #6b5040; line-height: 1.65; }
    .btn-primary { background: #c4622a; color: #fff9f4 !important; border-radius: 2px; padding: 16px 44px; font-size: 12px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; display: inline-block; }
    .cta-hint { font-size: 11px; color: #a08878; margin-top: 12px; font-weight: 300; }
    .footer { background: #f5efe3; border-top: 1px solid #ecdfd0; padding: 24px 48px; text-align: left; }
    .footer-note { font-size: 11px; color: #b8a898; font-weight: 300; margin: 0; }
    @media only screen and (max-width: 600px) {
      .hero { padding: 36px 28px 0 !important; }
      .hero h1 { font-size: 28px !important; }
      .ornament { padding: 20px 28px !important; }
      .body { padding: 0 28px 28px !important; }
      .sealed-block { padding: 20px !important; }
      .footer { padding: 20px 28px !important; }
    }
  `;

  return (
    <html lang={locale}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{subject}</title>
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
                width="200"
                style={{ display: 'block', margin: '0 auto' }}
              />
            </a>
          </div>

          <div className="card">

            {/* HERO */}
            <div className="hero">
              <div className="eyebrow">{locale === 'es' ? 'Tienes un mensaje' : 'You have a message'}</div>
              <h1>
                {senderName}<br />
                <span dangerouslySetInnerHTML={{ __html: titleLine2 }} />
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
              <p>{t.ctaIntro}</p>
              <div className="sealed-block">
                <div className="sealed-icon">✦</div>
                <div className="sealed-text">{t.contentHidden}</div>
              </div>
              <a href={magicLink} className="btn-primary">
                {t.ctaButton}
              </a>
              <p className="cta-hint">{t.linkValid}</p>
            </div>

          </div>

          {/* FOOTER */}
          <div className="footer">
            <p className="footer-note">{t.footer}</p>
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
