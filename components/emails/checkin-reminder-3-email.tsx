import * as React from 'react';
import { getDictionary, Locale } from '@/lib/i18n';
import { getResend, DEFAULT_SENDER } from '@/lib/resend';

export interface CheckinReminder3EmailProps {
  checkinUrl: string;
  locale: Locale;
}

export async function CheckinReminder3Email({ 
  checkinUrl, 
  locale 
}: CheckinReminder3EmailProps) {
  const dict = await getDictionary(locale);
  const t = dict.emails.checkinReminder3;
  const common = dict.emails.common;
  const dashboardUrl = checkinUrl.replace(/confirmar-actividad.*/, 'dashboard').replace(/verify-status.*/, 'dashboard');
  const supportUrl = checkinUrl.replace(/confirmar-actividad.*/, 'contact').replace(/verify-status.*/, 'contact');

  return (
    <html lang={locale}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{t.subject}</title>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Source+Sans+3:wght@300;400;600&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background-color: #e8e0d5; font-family: 'Source Sans 3', sans-serif; padding: 40px 20px; color: #2c2318; }
          .email-wrapper { max-width: 650px; margin: 0 auto; }
          .top-header { text-align: center; margin-bottom: 24px; }
          .logo-title { font-family: 'Lora', serif; font-style: italic; font-size: 30px; color: #c0622a; margin-bottom: 4px; }
          .logo-subtitle { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #c0622a; font-weight: 500; }
          .card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
          .hero { background-color: #c0622a; padding: 32px 48px 28px; }
          .hero h1 { font-family: 'Lora', serif; font-size: 30px; font-weight: 700; color: #fff; line-height: 1.25; margin: 0; }
          .body { padding: 40px 48px; }
          .body p { font-size: 17px; line-height: 1.65; color: #3a2e24; margin-bottom: 20px; }
          hr { border: none; border-top: 1px solid #e0d8cf; margin: 28px 0; }
          .btn-primary { display: block; background: #c0622a; color: #fff !important; text-decoration: none; text-align: center; padding: 16px 24px; border-radius: 8px; font-size: 16px; font-weight: 600; margin-bottom: 12px; }
          .sign-off { padding: 0 48px 36px; }
          .sign-off p { font-size: 15px; color: #3a2e24; line-height: 1.6; margin-bottom: 4px; }
          .sign-off .firma { font-family: 'Lora', serif; font-style: italic; color: #8a6a50; font-size: 15px; }
          .footer { text-align: center; padding: 20px 0 0; }
          .footer .footer-logo { font-family: 'Lora', serif; font-style: italic; font-size: 16px; color: #c0622a; margin-bottom: 8px; }
          .footer p { font-size: 12px; color: #8a7a6a; line-height: 1.6; }
          .footer a { color: #8a7a6a; text-decoration: underline; }
        `}} />
      </head>
      <body>
        <div className="email-wrapper">
          <div className="top-header">
            <div className="logo-title">{common.footerSignature}</div>
            <div className="logo-subtitle">{common.tagline}</div>
          </div>
          <div className="card">
            <div className="hero">
              <h1>{t.subject}</h1>
            </div>
            <div className="body">
              <p>{t.body.line1}</p>
              <p>{t.body.line2}</p>
              <p>{t.body.line3}</p>
              <p>{t.body.line4}</p>
              
              <a href={checkinUrl} className="btn-primary" style={{ marginTop: '24px' }}>
                {t.body.cta}
              </a>
            </div>
            <div className="sign-off">
              <hr />
              <p style={{ whiteSpace: 'pre-wrap' }}>{t.body.footer}</p>
              <p className="firma">— {common.footerSignature}</p>
              
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
            <p>
              <a href={dashboardUrl}>{common.dashboardLink}</a> · <a href={supportUrl}>{common.supportLink}</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

export async function sendCheckinReminder3Email(toUserEmail: string, checkinUrl: string, locale: Locale) {
  const resend = getResend();
  const dict = await getDictionary(locale);
  
  if (!resend) {
    console.error("Resend client not available");
    return { error: "Resend client not available" };
  }

  try {
    const data = await resend.emails.send({
      from: DEFAULT_SENDER,
      to: toUserEmail,
      subject: dict.emails.checkinReminder3.subject,
      react: await CheckinReminder3Email({ checkinUrl, locale }),
    });
    return { data };
  } catch (error) {
    console.error("Error sending Checkin Reminder 3:", error);
    return { error };
  }
}
