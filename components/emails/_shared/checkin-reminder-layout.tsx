import * as React from 'react';
import { Locale } from '@/lib/i18n';

export const checkinReminderStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Source+Sans+3:wght@300;400;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background-color: #f5f0e8; font-family: 'Source Sans 3', sans-serif; padding: 40px 20px; color: #2c2318; }
  .email-wrapper { max-width: 580px; margin: 0 auto; }
  .top-header { text-align: center; margin-bottom: 32px; }
  .logo-title { font-family: 'Lora', Georgia, serif; font-style: italic; font-size: 24px; color: #c4622a; margin-bottom: 5px; }
  .logo-subtitle { font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: #c4724a; font-weight: 400; }
  .card { background: #fffdf9; border-radius: 4px; border: 1px solid #e8e0d0; box-shadow: none; overflow: hidden; }
  .eyebrow { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #c4622a; font-weight: 500; margin-bottom: 16px; }
  .hero { background: #fffdf9; padding: 48px 48px 0; }
  .hero h1 { font-family: 'Lora', Georgia, serif; font-size: 38px; font-weight: 400; color: #1a0e09; line-height: 1.18; margin: 0; }
  .hero h1 em { font-style: italic; color: #c4622a; }
  .ornament { display: flex; align-items: center; gap: 12px; padding: 28px 48px; }
  .ornament-line { flex: 1; height: 1px; background: #ddd0bc; }
  .ornament-glyph { font-family: 'Lora', serif; font-size: 14px; color: #c4622a; opacity: 0.55; }
  .body { padding: 0 48px 32px; }
  .body p { font-size: 14px; line-height: 1.78; color: #4a3728; font-weight: 300; margin-bottom: 20px; }
  hr { border: none; border-top: 1px solid #f0e8d8; margin: 0; }
  .btn-primary { display: inline-block; background: #c4622a; color: #fff9f4 !important; text-decoration: none; text-align: center; padding: 16px 44px; border-radius: 2px; font-size: 12px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; }
  .sign-off { padding: 0 48px 36px; }
  .sign-off p { font-size: 13px; color: #6b5040; line-height: 1.7; margin-bottom: 4px; font-weight: 300; white-space: pre-wrap; }
  .firma { font-family: 'Lora', Georgia, serif; font-style: italic; color: #c4622a; font-size: 15px; margin-top: 8px; }
  .footer { background: #f5efe3; border-top: 1px solid #ecdfd0; padding: 16px 48px; display: flex; justify-content: space-between; align-items: center; }
  .footer a { font-size: 11px; color: #a08878; text-decoration: none; font-weight: 300; }
  @media only screen and (max-width: 600px) {
    .hero { padding: 36px 28px 0 !important; }
    .hero h1 { font-size: 28px !important; }
    .ornament { padding: 20px 28px !important; }
    .body { padding: 0 28px 28px !important; }
    .sign-off { padding: 0 28px 28px !important; }
    .footer { padding: 16px 28px !important; flex-direction: column; gap: 8px; text-align: center; }
  }
`;

interface CommonStrings {
  footerSignature: string;
  tagline: string;
  externalFooter: string;
  dashboardLink: string;
  supportLink: string;
}

interface CheckinReminderLayoutProps {
  locale: Locale;
  title: string;
  heroTitle: string;
  heroEyebrow: string;
  checkinUrl: string;
  dashboardUrl: string;
  supportUrl: string;
  common: CommonStrings;
  body: {
    line1: string;
    line2: string;
    line3: string;
    cta: string;
    footer: string;
  };
}

export function CheckinReminderLayout({
  locale,
  title,
  heroTitle,
  heroEyebrow,
  checkinUrl,
  dashboardUrl,
  supportUrl,
  common,
  body,
}: CheckinReminderLayoutProps) {
  const titleLines = heroTitle.split('\n');
  return (
    <html lang={locale}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <style dangerouslySetInnerHTML={{ __html: checkinReminderStyles }} />
      </head>
      <body>
        <div className="email-wrapper">
          <div className="top-header">
            <div className="logo-title">
              <a href="https://carrymywords.com" style={{ color: 'inherit', textDecoration: 'none' }}>
                {common.footerSignature}
              </a>
            </div>
            <div className="logo-subtitle">{common.tagline}</div>
          </div>
          <div className="card">
            <div className="hero">
              <div className="eyebrow">{heroEyebrow}</div>
              <h1>
                {titleLines[0]}{titleLines[1] && <><br /><em>{titleLines[1]}</em></>}
              </h1>
            </div>
            <div className="ornament">
              <div className="ornament-line" />
              <span className="ornament-glyph">◆</span>
              <div className="ornament-line" />
            </div>
            <div className="body">
              <p>{body.line1}</p>
              <p>{body.line2}</p>
              <p>{body.line3}</p>
              <a href={checkinUrl} className="btn-primary" style={{ marginTop: '8px' }}>
                {body.cta}
              </a>
            </div>
            <hr />
            <div className="sign-off">
              <p style={{ marginTop: '24px' }}>{body.footer}</p>
              <p className="firma">— {common.footerSignature}</p>
            </div>
          </div>
          <div className="footer">
            <a href={dashboardUrl}>{common.dashboardLink}</a>
            <a href={supportUrl}>{common.supportLink}</a>
          </div>
        </div>
      </body>
    </html>
  );
}
