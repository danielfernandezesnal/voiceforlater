
// Helper type for the dictionary structure we expect
export type EmailDictionary = {
  emails: {
    common: {
      footerSignature: string;
      tagline: string;
      externalFooter: string;
    };
    magicLink: {
      subject: string;
      subjectAdmin: string;
      title: string;
      adminBadge: string;
      intro: string;
      button: string;
      ignore: string;
      tagline: string;
    };
    messageDelivery: {
      subject: string;
      title: string;
      intro: string;
      footer: string;
      viewVideo: string;
      listenAudio: string;
      linkValid: string;
      linkError: string;
      ctaButton: string;
      ctaIntro: string;
      ctaSubject: string;
      preheader: string;
      contentHidden: string;
      tagline: string;
    };
    checkinReminder: {
      subject: string;
      title: string;
      intro: string;
      attempt: string;
      button: string;
      warning: string;
      tagline: string;
    };
    trustedContactVerify: {
      subject: string;
      eyebrow: string;
      eyebrowUnknown: string;
      title: string;
      intro: string;
      boxTitle: string;
      boxText: string;
      button: string;
      secondary: string;
      tagline: string;
    };
    trustedContactInvitation: {
      subject: string;
      preheader: string;
      heading: string;
      p1: string;
      p2: string;
      roleTitle: string;
      roleP1: string;
      roleP2: string;
      moreTitle: string;
      moreText: string;
      thanks: string;
      signature: string;
      footerLogo: string;
      footerLegal: string;
      tagline: string;
    };
    messageSpecial: {
      subject: string;
      preheader: string;
      heading: string;
      p1: string;
      p2: string;
      button: string;
      closing: string;
      signature: string;
      tagline: string;
    };
    messagePosthumous: {
      subject: string;
      epigraph: string;
      preheader: string;
      heading: string;
      p1: string;
      p2: string;
      button: string;
      closing: string;
      footerLegal: string;
      tagline: string;
    };
    resetPassword: {
      subject: string;
      eyebrow: string;
      title: string;
      intro: string;
      cta: string;
      securityNote: string;
      tagline: string;
    };
    paymentFailed: {
      subject: string;
      eyebrow: string;
      title: string;
      intro: string;
      action: string;
      footer: string;
      tagline: string;
    };
  };
};

const COMMON_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap');
  @media only screen and (max-width: 600px) {
    .container { width: 100% !important; padding: 20px !important; }
    .body-cell { padding: 40px 30px !important; }
    .hero-img { height: 200px !important; }
    .title-h1 { font-size: 28px !important; }
  }
`;

const SHARED_FOOTER = (dict: EmailDictionary) => `
  <!-- FOOTER BAR -->
  <tr>
    <td align="center" style="background:#FAF8F7;padding:30px 40px;border-top:1px solid #EAE4D9;">
       <p style="margin:0;font-size:12px;color:#BCA391;line-height:1.6;">
        ${dict.emails.common.footerSignature} © 2026. ${dict.emails.common.externalFooter}<br>
        <a href="https://carrymywords.com" style="color:#2D2D2D;text-decoration:none;font-weight:700;">carrymywords.com</a>
       </p>
    </td>
  </tr>
`;

export const getMagicLinkTemplate = (dict: EmailDictionary, data: { magicLink: string, isAdminLogin: boolean }) => {
  const t = dict.emails.magicLink;
  const subject = data.isAdminLogin ? t.subjectAdmin : t.subject;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${COMMON_STYLES}</style>
</head>
<body style="margin:0;padding:0;background-color:#F8F5F2;font-family:'Inter', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F5F2;padding:60px 20px;">
    <tr>
      <td align="center">
        <table class="container" width="100%" cellpadding="0" cellspacing="0" style="max-width:750px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(42,37,32,0.06);">
          <!-- HEADER -->
          <tr>
            <td align="center" style="background-color:#96482C;padding:40px 0;">
              <div style="font-family:'Libre Baskerville', serif;font-style:italic;font-size:32px;color:#ffffff;letter-spacing:-0.5px;">Carry my Words</div>
              <div style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-top:8px;">${dict.emails.common.tagline}</div>
            </td>
          </tr>
          <!-- BODY -->
          <tr>
            <td class="body-cell" style="padding:60px;">
              ${data.isAdminLogin ? `<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin-bottom:28px;border-radius:0 8px 8px 0;font-size:14px;color:#92400e;"><strong>${t.adminBadge}</strong></div>` : ''}
              <h1 class="title-h1" style="font-family:'Libre Baskerville', serif;font-size:34px;font-weight:700;color:#2A2520;line-height:1.2;margin:0 0 24px;">${t.title}</h1>
              <p style="font-size:18px;line-height:1.75;color:#5D534A;margin:0 0 35px 0;">${t.intro}</p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:10px 0 30px;">
                    <a href="${data.magicLink}" style="background-color:#96482C;color:#ffffff;padding:20px 50px;text-decoration:none;border-radius:12px;font-weight:600;font-size:18px;display:inline-block;box-shadow:0 10px 30px rgba(150,72,44,0.15);">${t.button}</a>
                  </td>
                </tr>
              </table>
              <p style="font-size:13px;line-height:1.6;color:#BCA391;margin:0;text-align:center;">${t.ignore}</p>
              
              <div style="height:1px;background:#EAE4D9;margin:50px 0 35px;"></div>
              
              <p style="margin:0;font-family:'Libre Baskerville', serif;font-style:italic;font-size:16px;color:#96482C;text-align:center;">${t.tagline}</p>
            </td>
          </tr>
          ${SHARED_FOOTER(dict)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return { subject, html };
};

export const getMessageDeliveryTemplate = (dict: EmailDictionary, data: { contentHtml: string, magicLink: string, senderName: string }) => {
  const t = dict.emails.messageDelivery;
  const subject = t.ctaSubject.replace('{senderName}', data.senderName);
  
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${COMMON_STYLES}</style>
</head>
<body style="margin:0;padding:0;background-color:#F8F5F2;font-family:'Inter', sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">${t.preheader}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F5F2;padding:60px 20px;">
  <tr>
    <td align="center">
      <table class="container" width="100%" cellpadding="0" cellspacing="0" style="max-width:750px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(42,37,32,0.06);">
        <tr>
          <td>
            <div style="width:100%;height:300px;background-color:#96482C;overflow:hidden;" class="hero-img">
              <img src="https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=1600&auto=format&fit=crop" style="width:100%;height:100%;object-fit:cover;opacity:0.85;">
            </div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:40px 0 0;">
            <div style="font-family:'Libre Baskerville', serif;font-style:italic;font-size:32px;color:#96482C;letter-spacing:-0.5px;">Carry my Words</div>
            <div style="font-size:12px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#BCA391;margin-top:10px;">${dict.emails.common.tagline}</div>
          </td>
        </tr>
        <tr>
          <td class="body-cell" style="padding:50px 60px;">
            <h1 class="title-h1" style="font-family:'Libre Baskerville', serif;font-size:36px;font-weight:700;color:#2A2520;line-height:1.2;margin:0 0 24px;">${subject}</h1>
            <p style="font-size:18px;line-height:1.75;color:#5D534A;margin:0 0 32px;">${t.ctaIntro}</p>
            <div style="background-color:#FDFBFA;border:1.5px solid #EAE4D9;border-radius:16px;padding:45px 40px;text-align:center;font-family:'Libre Baskerville', serif;color:#8A7A6A;font-style:italic;font-size:20px;line-height:1.8;margin-bottom:45px;background-image:linear-gradient(rgba(253,251,250,0.95),rgba(253,251,250,0.95)),url('https://www.transparenttextures.com/patterns/handmade-paper.png');">
              <div style="font-size:32px;margin-bottom:15px;opacity:0.6;">✉️</div>
              "${t.contentHidden}"
            </div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${data.magicLink}" style="background-color:#96482C;color:#ffffff;padding:22px 55px;text-decoration:none;border-radius:12px;font-weight:600;font-size:18px;display:inline-block;box-shadow:0 10px 30px rgba(150,72,44,0.15);">${t.ctaButton}</a>
                  <p style="font-size:13px;color:#BCA391;margin-top:24px;font-style:italic;">${t.linkValid}</p>
                </td>
              </tr>
            </table>
            <div style="height:1px;background:#EAE4D9;margin:50px 0 35px;"></div>
            <p style="margin:0;font-family:'Libre Baskerville', serif;font-style:italic;font-size:16px;color:#96482C;text-align:center;">${t.tagline}</p>
          </td>
        </tr>
        ${SHARED_FOOTER(dict)}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
  return { subject, html };
};

export const getCheckinReminderTemplate = (dict: EmailDictionary, data: { attempts: number, confirmUrl: string }) => {
  const t = dict.emails.checkinReminder;
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${COMMON_STYLES}</style>
</head>
<body style="margin:0;padding:0;background-color:#F8F5F2;font-family:'Inter', sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F5F2;padding:60px 20px;">
  <tr>
    <td align="center">
      <table class="container" width="100%" cellpadding="0" cellspacing="0" style="max-width:750px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(42,37,32,0.06);">
        <tr>
          <td>
            <div style="width:100%;height:280px;background-color:#96482C;overflow:hidden;" class="hero-img">
              <img src="https://images.unsplash.com/photo-1506784914152-d8478d3d0b2e?q=80&w=1600&auto=format&fit=crop" style="width:100%;height:100%;object-fit:cover;opacity:0.85;">
            </div>
          </td>
        </tr>
        <tr>
          <td class="body-cell" style="padding:60px;">
            <div style="font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#96482C;margin-bottom:12px;">Intento ${data.attempts} de 3 · Recordatorio</div>
            <h1 class="title-h1" style="font-family:'Libre Baskerville', serif;font-size:36px;font-weight:700;color:#2A2520;line-height:1.2;margin:0 0 24px;">¿Seguís por acá?</h1>
            <p style="font-size:18px;line-height:1.75;color:#5D534A;margin:0 0 35px 0;">Es momento de confirmar tu actividad para asegurar que tus palabras guardadas sigan protegidas.</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:10px 0 30px;">
                  <a href="${data.confirmUrl}" style="background-color:#96482C;color:#ffffff;padding:22px 55px;text-decoration:none;border-radius:12px;font-weight:600;font-size:18px;display:inline-block;box-shadow:0 10px 30px rgba(150,72,44,0.15);">${t.button}</a>
                </td>
              </tr>
            </table>
            <div style="background-color:#FAF8F7;border-left:4px solid #96482C;border-radius:0 10px 10px 0;padding:24px;font-size:15px;color:#8A7A6A;line-height:1.6;"><strong>Aviso:</strong> Si no confirmás después de 3 intentos, comenzaremos la notificación a tus contactos de confianza.</div>
          </td>
        </tr>
        ${SHARED_FOOTER(dict)}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
  return { subject: t.subject, html };
};

export const getTrustedContactVerifyTemplate = (dict: EmailDictionary, data: { contactFirstName: string, senderFirstName: string, verifyUrl: string }) => {
  const t = dict.emails.trustedContactVerify;
  const subject = t.subject.replace('{senderFirstName}', data.senderFirstName);
  const eyebrow = data.contactFirstName ? t.eyebrow.replace('{contactFirstName}', data.contactFirstName) : t.eyebrowUnknown;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${COMMON_STYLES}</style>
</head>
<body style="margin:0;padding:0;background-color:#FEF9F6;font-family:'Inter', sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FEF9F6;padding:60px 20px;">
  <tr>
    <td align="center">
      <table class="container" width="100%" cellpadding="0" cellspacing="0" style="max-width:750px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(150,72,44,0.12);">
        <tr>
          <td>
            <div style="width:100%;height:280px;background-color:#96482C;overflow:hidden;" class="hero-img">
              <img src="https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1600&auto=format&fit=crop" style="width:100%;height:100%;object-fit:cover;opacity:0.85;">
            </div>
          </td>
        </tr>
        <tr>
          <td class="body-cell" style="padding:60px;">
            <div style="font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#96482C;margin-bottom:12px;">${eyebrow}</div>
            <h1 class="title-h1" style="font-family:'Libre Baskerville', serif;font-size:36px;font-weight:700;color:#2A2520;line-height:1.2;margin:0 0 24px;">${t.title.replace('{senderFirstName}', data.senderFirstName)}</h1>
            <p style="font-size:18px;line-height:1.75;color:#5D534A;margin:0 0 35px 0;">${t.intro.replace('{senderFirstName}', data.senderFirstName)}</p>
            <div style="background-color:#FFF5F5;border-left:4px solid #C4623A;border-radius:0 12px 12px 0;padding:24px;margin-bottom:35px;">
              <p style="margin:0 0 8px;font-weight:700;color:#C4623A;font-size:16px;">${t.boxTitle.replace('{senderFirstName}', data.senderFirstName)}</p>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#6A4040;">${t.boxText}</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${data.verifyUrl}" style="background-color:#C4623A;color:#ffffff;padding:22px 55px;text-decoration:none;border-radius:12px;font-weight:600;font-size:18px;display:inline-block;box-shadow:0 10px 30px rgba(150,72,44,0.15);">${t.button}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        ${SHARED_FOOTER(dict)}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
  return { subject, html };
};

export const getTrustedContactInvitationTemplate = (dict: EmailDictionary, data: { contactFirstName: string, senderFullName: string, senderFirstName: string }) => {
  const t = dict.emails.trustedContactInvitation;
  const replaceAll = (text: string) => text ? text.replace(/{{contactFirstName}}/g, data.contactFirstName).replace(/{{senderFullName}}/g, data.senderFullName).replace(/{{senderFirstName}}/g, data.senderFirstName) : '';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${COMMON_STYLES}</style>
</head>
<body style="margin:0;padding:0;background-color:#F8F5F2;font-family:'Inter', sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F5F2;padding:60px 20px;">
  <tr>
    <td align="center">
      <table class="container" width="100%" cellpadding="0" cellspacing="0" style="max-width:750px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(42,37,32,0.06);">
        <tr>
          <td>
            <div style="width:100%;height:280px;background-color:#96482C;overflow:hidden;" class="hero-img">
              <img src="https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?q=80&w=1600&auto=format&fit=crop" style="width:100%;height:100%;object-fit:cover;opacity:0.85;">
            </div>
          </td>
        </tr>
        <tr>
          <td class="body-cell" style="padding:60px;">
            <div style="font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#96482C;margin-bottom:12px;">${replaceAll(t.preheader)}</div>
            <h1 class="title-h1" style="font-family:'Libre Baskerville', serif;font-size:36px;font-weight:700;color:#2A2520;line-height:1.2;margin:0 0 24px;">${t.heading}</h1>
            <p style="font-size:18px;line-height:1.75;color:#5D534A;margin:0 0 25px;">${replaceAll(t.p1)}</p>
            <p style="font-size:18px;line-height:1.75;color:#5D534A;margin:0 0 35px;">${replaceAll(t.p2)}</p>
            <div style="background-color:#FAF8F7;border-left:4px solid #96482C;border-radius:0 10px 10px 0;padding:30px;margin-bottom:30px;">
              <h3 style="font-family:'Libre Baskerville', serif;margin:0 0 10px;color:#96482C;">${t.roleTitle}</h3>
              <p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#5D534A;">${replaceAll(t.roleP1)}</p>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#5D534A;">${replaceAll(t.roleP2)}</p>
            </div>
            <p style="margin:0;font-family:'Libre Baskerville', serif;font-style:italic;font-size:16px;color:#2A2520;text-align:center;">${t.thanks}<br>— ${t.signature}</p>
          </td>
        </tr>
        ${SHARED_FOOTER(dict)}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
  return { subject: replaceAll(t.subject), html };
};

export const getMessageSpecialTemplate = (dict: EmailDictionary, data: { recipientName: string, senderName: string, messageUrl: string }) => {
  const t = dict.emails.messageSpecial;
  const replaceAll = (text: string) => text ? text.replace(/{{RECIPIENT_NAME}}/g, data.recipientName).replace(/{{SENDER_NAME}}/g, data.senderName).replace(/{{MESSAGE_URL}}/g, data.messageUrl) : '';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${COMMON_STYLES}</style>
</head>
<body style="margin:0;padding:0;background-color:#FDF9F7;font-family:'Inter', sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FDF9F7;padding:60px 20px;">
  <tr>
    <td align="center">
      <table class="container" width="100%" cellpadding="0" cellspacing="0" style="max-width:750px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(150,72,44,0.1);">
        <tr>
          <td>
            <div style="width:100%;height:300px;background-color:#C0522A;overflow:hidden;" class="hero-img">
              <img src="https://images.unsplash.com/photo-1496412705862-e0088f16f791?q=80&w=1600&auto=format&fit=crop" style="width:100%;height:100%;object-fit:cover;opacity:0.9;">
            </div>
          </td>
        </tr>
        <tr>
          <td class="body-cell" style="padding:60px;">
            <div style="font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#C0522A;margin-bottom:12px;">${replaceAll(t.preheader)}</div>
            <h1 class="title-h1" style="font-family:'Libre Baskerville', serif;font-size:38px;font-weight:700;color:#2A2520;line-height:1.2;margin:0 0 24px;">${t.heading}</h1>
            <p style="font-size:18px;line-height:1.75;color:#5D534A;margin:0 0 25px;">${replaceAll(t.p1)}</p>
            <p style="font-size:18px;line-height:1.75;color:#5D534A;margin:0 0 40px;">${replaceAll(t.p2)}</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${data.messageUrl}" style="background-color:#C0522A;color:#ffffff;padding:22px 55px;text-decoration:none;border-radius:12px;font-weight:600;font-size:18px;display:inline-block;box-shadow:0 10px 30px rgba(192,82,42,0.15);">${t.button}</a>
                </td>
              </tr>
            </table>
            <div style="height:1px;background:#EAE4D9;margin:50px 0 35px;"></div>
            <p style="margin:0;font-family:'Libre Baskerville', serif;font-style:italic;font-size:17px;color:#2A2520;text-align:center;">${t.closing}<br>— ${t.signature}</p>
          </td>
        </tr>
        ${SHARED_FOOTER(dict)}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
  return { subject: replaceAll(t.subject), html };
};

export const getMessagePosthumousTemplate = (dict: EmailDictionary, data: { recipientName: string, senderName: string, messageUrl: string }) => {
  const t = dict.emails.messagePosthumous;
  const replaceAll = (text: string) => text ? text.replace(/{{RECIPIENT_NAME}}/g, data.recipientName).replace(/{{SENDER_NAME}}/g, data.senderName).replace(/{{MESSAGE_URL}}/g, data.messageUrl) : '';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${COMMON_STYLES}</style>
</head>
<body style="margin:0;padding:0;background-color:#F5F2EF;font-family:'Inter', sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F2EF;padding:60px 20px;">
  <tr>
    <td align="center">
      <table class="container" width="100%" cellpadding="0" cellspacing="0" style="max-width:750px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 80px rgba(0,0,0,0.08);">
        <tr>
          <td>
            <div style="width:100%;height:350px;background-color:#2A2520;overflow:hidden;" class="hero-img">
              <img src="https://images.unsplash.com/photo-1501139083538-0139583c060f?q=80&w=1600&auto=format&fit=crop" style="width:100%;height:100%;object-fit:cover;opacity:0.8;">
            </div>
          </td>
        </tr>
        <tr>
          <td class="body-cell" style="padding:70px 80px;">
            <div style="font-family:'Libre Baskerville', serif;font-style:italic;font-size:16px;color:#8A7A6A;margin-bottom:30px;text-align:center;line-height:1.6;">${t.epigraph}</div>
            <h1 class="title-h1" style="font-family:'Libre Baskerville', serif;font-size:40px;font-weight:700;color:#2A2520;line-height:1.2;margin:0 0 35px;text-align:center;">${t.heading}</h1>
            <p style="font-size:19px;line-height:1.8;color:#2A2520;margin:0 0 25px;">${replaceAll(t.p1)}</p>
            <p style="font-size:19px;line-height:1.8;color:#2A2520;margin:0 0 45px;">${replaceAll(t.p2)}</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${data.messageUrl}" style="background-color:#2A2520;color:#ffffff;padding:24px 60px;text-decoration:none;border-radius:100px;font-weight:600;font-size:18px;display:inline-block;box-shadow:0 15px 40px rgba(0,0,0,0.15);">${t.button}</a>
                </td>
              </tr>
            </table>
            <div style="height:1px;background:#EAE4D9;margin:60px 0 40px;"></div>
            <p style="margin:0;font-family:'Libre Baskerville', serif;font-style:italic;font-size:18px;color:#2A2520;text-align:center;">${t.closing}<br>— ${dict.emails.common.footerSignature}</p>
          </td>
        </tr>
        ${SHARED_FOOTER(dict)}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
  return { subject: replaceAll(t.subject), html };
};

export const getResetPasswordTemplate = (dict: EmailDictionary, data: { password: string }) => {
  const t = dict.emails.resetPassword;
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${COMMON_STYLES}</style>
</head>
<body style="margin:0;padding:0;background-color:#F8F5F2;font-family:'Inter', sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F5F2;padding:60px 20px;">
  <tr>
    <td align="center">
      <table class="container" width="100%" cellpadding="0" cellspacing="0" style="max-width:750px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(42,37,32,0.06);">
        <tr>
          <td align="center" style="background-color:#C4623A;padding:40px 0;">
             <div style="font-family:'Libre Baskerville', serif;font-style:italic;font-size:32px;color:#ffffff;letter-spacing:-0.5px;">Carry my Words</div>
          </td>
        </tr>
        <tr>
          <td class="body-cell" style="padding:60px;">
            <div style="font-size:12px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#C4623A;margin-bottom:12px;">Seguridad</div>
            <h1 class="title-h1" style="font-family:'Libre Baskerville', serif;font-size:32px;font-weight:700;color:#2A2520;line-height:1.2;margin:0 0 24px;">${t.title}</h1>
            <p style="font-size:18px;line-height:1.75;color:#5D534A;margin:0 0 28px;">${t.intro}</p>
            <div style="background:#FAF8F7;border-radius:12px;padding:30px;text-align:center;border:1.5px dashed #EAE4D9;margin-bottom:28px;">
               <div style="font-size:13px;color:#8A7A6A;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;">Tu nueva contraseña</div>
               <div style="font-family:monospace;font-size:36px;font-weight:700;color:#2A2520;letter-spacing:0.1em;">${data.password}</div>
            </div>
            <p style="margin:0;font-size:14px;color:#BCA391;text-align:center;">${t.securityNote}</p>
          </td>
        </tr>
        ${SHARED_FOOTER(dict)}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
  return { subject: t.subject, html };
};

export const getPaymentFailedTemplate = (dict: EmailDictionary, data: { planStatus: string }) => {
  const t = dict.emails.paymentFailed;
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${COMMON_STYLES}</style>
</head>
<body style="margin:0;padding:0;background-color:#F8F5F2;font-family:'Inter', sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F5F2;padding:60px 20px;">
  <tr>
    <td align="center">
      <table class="container" width="100%" cellpadding="0" cellspacing="0" style="max-width:750px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(42,37,32,0.06);">
        <tr>
          <td align="center" style="background-color:#C4623A;padding:40px 0;">
             <div style="font-family:'Libre Baskerville', serif;font-style:italic;font-size:32px;color:#ffffff;letter-spacing:-0.5px;">Carry my Words</div>
          </td>
        </tr>
        <tr>
          <td class="body-cell" style="padding:60px;">
            <div style="font-size:12px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#C4623A;margin-bottom:12px;">Aviso de suscripción</div>
            <h1 class="title-h1" style="font-family:'Libre Baskerville', serif;font-size:32px;font-weight:700;color:#2A2520;line-height:1.2;margin:0 0 24px;">${t.title}</h1>
            <p style="font-size:18px;line-height:1.75;color:#5D534A;margin:0 0 32px;">${t.intro.replace('{planStatus}', data.planStatus)}</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="https://carrymywords.com/dashboard" style="background-color:#C4623A;color:#ffffff;padding:20px 50px;text-decoration:none;border-radius:12px;font-weight:600;font-size:18px;display:inline-block;">${t.action}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        ${SHARED_FOOTER(dict)}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
  return { subject: t.subject, html };
};
