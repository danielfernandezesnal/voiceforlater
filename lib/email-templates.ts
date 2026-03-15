
// Helper type for the dictionary structure we expect
// Ideally this should be inferred from the JSON files, but for now we define the shape we need
export type EmailDictionary = {
  emails: {
    common: {
      footerSignature: string;
      tagline: string;
    };
    magicLink: {
      subject: string;
      subjectAdmin: string;
      title: string;
      adminBadge: string;
      intro: string;
      button: string;
      ignore: string;
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
    };
    checkinReminder: {
      subject: string;
      title: string;
      intro: string;
      attempt: string;
      button: string;
      warning: string;
    };
    trustedContactVerify: {
      subject: string;
      greeting: string;
      greetingUnknown: string;
      title: string;
      intro: string;
      explanation: string;
      boxTitle: string;
      boxText: string;
      button: string;
      falseAlarm: string;
      expiry: string;
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
    };
    messageSpecial: {
      subject: string;
      preheader: string;
      heading: string;
      p1: string;
      p2: string;
      button: string;
      info: string;
      closing: string;
      signature: string;
    };
    messagePosthumous: {
      subject: string;
      preheader: string;
      heading: string;
      p1: string;
      p2: string;
      button: string;
      closing: string;
      footerLegal: string;
    };
    resetPassword: {
      subject: string;
      title: string;
      intro: string;
      passwordLabel: string;
      warning: string;
      footer: string;
    };
    paymentFailed: {
      subject: string;
      title: string;
      intro: string;
      action: string;
      footer: string;
    };
  };
};

export const getMagicLinkTemplate = (dict: EmailDictionary, data: { magicLink: string, isAdminLogin: boolean }) => {
  const t = dict.emails.magicLink;
  const subject = data.isAdminLogin ? t.subjectAdmin : t.subject;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(196,98,58,0.08);">
          <!-- HEADER -->
          <tr>
            <td align="center" style="background:#C4623A;padding:32px 40px;">
              <div style="font-family:Georgia,serif;font-style:italic;font-size:24px;color:#ffffff;letter-spacing:-0.3px;">
                Carry My Words
              </div>
            </td>
          </tr>
          <!-- BODY -->
          <tr>
            <td style="padding:40px;">
              <div style="font-family:Georgia,serif;font-size:26px;font-weight:600;color:#2D2D2D;line-height:1.3;margin-bottom:16px;">
                ${t.title}
              </div>
              ${data.isAdminLogin ? `<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin-bottom:20px;border-radius:0 8px 8px 0;font-family:sans-serif;font-size:14px;color:#92400e;"><strong>${t.adminBadge}</strong></div>` : ''}
              <p style="font-size:15px;line-height:1.7;color:#555555;margin:0 0 32px 0;">
                ${t.intro}
              </p>
              <!-- CTA BUTTON -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${data.magicLink}" style="background-color:#C4623A;color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:100px;font-family:sans-serif;font-weight:600;font-size:16px;display:inline-block;box-shadow:0 4px 12px rgba(196,98,58,0.2);">
                      ${t.button}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:13px;line-height:1.6;color:#9B8B7E;margin:0;">
                ${t.ignore}
              </p>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="padding:0 40px 36px;" align="center">
              <div style="height:1px;background:#EAE4D9;margin-bottom:28px;"></div>
              <p style="margin:0 0 8px;font-family:Georgia,serif;font-style:italic;font-size:14px;color:#C4623A;font-weight:600;">
                Carry My Words
              </p>
              <p style="margin:0;font-size:11px;color:#9B8B7E;line-height:1.6;">
                <a href="https://carrymywords.com" style="color:#9B8B7E;text-decoration:none;">carrymywords.com</a>
              </p>
            </td>
          </tr>
        </table>
        <!-- URL de respaldo -->
        <p style="margin-top:20px;font-size:11px;color:#9B8B7E;text-align:center;word-break:break-all;">
          ${data.magicLink}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return { subject, html };
};

export const getMessageDeliveryTemplate = (dict: EmailDictionary, data: { contentHtml: string, magicLink: string, senderName: string }) => {
  const t = dict.emails.messageDelivery;
  const subject = t.ctaSubject.replace('{senderName}', data.senderName);
  
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600&display=swap');
</style>
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:sans-serif;">

<!-- PREHEADER -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
  ${t.preheader}
</div>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(196,98,58,0.08);">

        <!-- HEADER -->
        <tr>
          <td align="center" style="background:#C4623A;padding:32px 40px;">
            <div style="font-family:Georgia,serif;font-weight:700;font-size:24px;color:#ffffff;letter-spacing:-0.01em;">
              Carry My Words
            </div>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:40px;">
            <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#2D2D2D;line-height:1.3;margin-bottom:16px;">
              ${subject}
            </div>
            
            <p style="font-size:16px;line-height:1.6;color:#555555;margin:0 0 32px 0;">
              ${t.ctaIntro}
            </p>

            <!-- CONTENT PLACEHOLDER (Hidden Content) -->
            <div style="background:#f5f0e8;border-radius:12px;padding:28px 32px;text-align:center;font-family:Georgia,serif;color:#6b5e52;font-style:italic;font-size:1.05rem;line-height:1.6;margin-bottom:32px;">
              ${t.contentHidden}
            </div>

            <!-- CTA BUTTON -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:10px 0;">
                  <a href="${data.magicLink}" style="background-color:#C4623A;color:#ffffff;padding:18px 48px;text-decoration:none;border-radius:100px;font-family:sans-serif;font-weight:600;font-size:16px;display:inline-block;box-shadow:0 4px 12px rgba(196,98,58,0.2);">
                    ${t.ctaButton}
                  </a>
                </td>
              </tr>
            </table>

            <p style="text-align:center;font-size:12px;color:#9B8B7E;margin-top:16px;">
              ${t.linkValid}
            </p>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:0 40px 40px;" align="center">
            <div style="height:1px;background:#EAE4D9;margin-bottom:32px;"></div>
            <p style="margin:0 0 12px;font-family:Georgia,serif;font-style:italic;font-size:14px;color:#C4623A;font-weight:600;">
              Carry My Words
            </p>
            <p style="margin:0;font-size:12px;color:#9B8B7E;line-height:1.6;max-width:300px;">
              ${t.footer}<br>
              <a href="https://carrymywords.com" style="color:#C4623A;text-decoration:none;font-weight:600;">carrymywords.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>
`;
  return { subject, html };
};


export const getCheckinReminderTemplate = (dict: EmailDictionary, data: { attempts: number, confirmUrl: string }) => {
  const t = dict.emails.checkinReminder;
  // Use data.confirmUrl which is now /confirmar-actividad
  const dashboardUrl = data.confirmUrl.replace('/confirmar-actividad', '/dashboard');
  const supportUrl = data.confirmUrl.replace('/confirmar-actividad', '/contact');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t.subject}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Source+Sans+3:wght@300;400;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background-color: #e8e0d5; font-family: 'Source Sans 3', sans-serif; padding: 40px 20px; color: #2c2318; }
  .email-wrapper { max-width: 560px; margin: 0 auto; }
  .top-header { text-align: center; margin-bottom: 24px; }
  .logo-title { font-family: 'Lora', serif; font-style: italic; font-size: 26px; color: #c0622a; margin-bottom: 4px; }
  .logo-subtitle { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #c0622a; font-weight: 400; }
  .card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
  .hero { background-color: #c0622a; padding: 32px 40px 28px; }
  .hero-label { font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(255,255,255,0.7); margin-bottom: 10px; }
  .hero h1 { font-family: 'Lora', serif; font-size: 30px; font-weight: 700; color: #fff; line-height: 1.25; }
  .body { padding: 36px 40px; }
  .body p { font-size: 16px; line-height: 1.65; color: #3a2e24; margin-bottom: 20px; }
  hr { border: none; border-top: 1px solid #e0d8cf; margin: 28px 0; }
  .action-label { font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #c0622a; margin-bottom: 16px; }
  .btn-primary { display: block; background: #c0622a; color: #fff !important; text-decoration: none; text-align: center; padding: 16px 24px; border-radius: 8px; font-size: 16px; font-weight: 600; margin-bottom: 12px; }
  .reply-box { background: #f5f0ea; border-radius: 8px; padding: 16px 20px; display: flex; gap: 14px; align-items: flex-start; margin-bottom: 28px; }
  .reply-arrow { font-size: 18px; margin-top: 2px; flex-shrink: 0; color: #c0622a; }
  .reply-box p { font-size: 14px !important; line-height: 1.5 !important; color: #5a4a3a !important; margin-bottom: 0 !important; }
  .reply-box strong { color: #2c2318; font-weight: 600; display: block; margin-bottom: 2px; font-size: 15px; }
  .alert-box { border-left: 3px solid #c0622a; padding: 14px 18px; background: #faf6f2; border-radius: 0 8px 8px 0; }
  .alert-box p { font-size: 14px !important; color: #6a5040 !important; line-height: 1.55 !important; margin-bottom: 0 !important; }
  .sign-off { padding: 0 40px 36px; }
  .sign-off p { font-size: 15px; color: #3a2e24; line-height: 1.6; margin-bottom: 4px; }
  .sign-off .firma { font-family: 'Lora', serif; font-style: italic; color: #8a6a50; font-size: 15px; }
  .footer { text-align: center; padding: 20px 0 0; }
  .footer .footer-logo { font-family: 'Lora', serif; font-style: italic; font-size: 16px; color: #c0622a; margin-bottom: 8px; }
  .footer p { font-size: 12px; color: #8a7a6a; line-height: 1.6; }
  .footer a { color: #8a7a6a; text-decoration: underline; }
</style>
</head>
<body>
<div class="email-wrapper">
  <div class="top-header">
    <div class="logo-title">${dict.emails.common.footerSignature}</div>
    <div class="logo-subtitle"></div>
  </div>
  <div class="card">
    <div class="hero">
      <div class="hero-label">Intento ${data.attempts} de 3 · Check-in programado</div>
      <h1>¿Seguís por acá?</h1>
    </div>
    <div class="body">
      <p>Es momento de confirmar que seguís bien. Solo necesitamos saber que estás activo para que tus mensajes sigan protegidos y guardados tal como los dejaste.</p>
      <hr>
      <div class="action-label">Confirmá tu actividad</div>
      <a href="${data.confirmUrl}" class="btn-primary">Ir a confirmar mi actividad</a>
      <div class="reply-box">
        <span class="reply-arrow">🌐</span>
        <p>
          <strong>O entrá a tu cuenta</strong>
          Iniciá sesión desde cualquier dispositivo y tu actividad quedará registrada automáticamente.
        </p>
      </div>
      <div class="alert-box">
        <p>Si no confirmás después de <strong>3 intentos</strong>, contactaremos a tu(s) persona(s) de confianza y comenzaremos la entrega de tus mensajes.</p>
      </div>
    </div>
    <div class="sign-off">
      <hr>
      <p>Gracias por confiar en nosotros con algo tan importante.</p>
      <p class="firma">— El equipo de Carry My Words</p>
    </div>
  </div>
  <div class="footer">
    <div class="footer-logo">${dict.emails.common.footerSignature}</div>
    <p>Recibiste este email porque tenés un check-in programado activo.<br>
    <a href="${dashboardUrl}">Configurar frecuencia de check-ins</a> · <a href="${supportUrl}">Soporte</a></p>
  </div>
</div>
</body>
</html>`;
  return { subject: t.subject, html };
};

export const getTrustedContactVerifyTemplate = (dict: EmailDictionary, data: { name: string, userEmail: string, verifyUrl: string }) => {
  const t = dict.emails.trustedContactVerify;
  const subject = t.subject.replace('{email}', data.userEmail);

  const greeting = data.name
    ? t.greeting.replace('{name}', data.name)
    : t.greetingUnknown;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <!-- LOGO -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <div style="font-family:Georgia,serif;font-style:italic;font-size:22px;color:#C4623A;">
                Carry My Words
              </div>
            </td>
          </tr>
          <!-- CARD -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(196,98,58,0.08);">
              <!-- HEADER -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#C4623A;padding:32px 40px 28px;">
                    <div style="font-family:Georgia,serif;font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:10px;">
                      Carry My Words
                    </div>
                    <div style="font-family:Georgia,serif;font-size:26px;font-weight:600;color:#ffffff;line-height:1.25;">
                      ${greeting}
                    </div>
                  </td>
                </tr>
              </table>
              <!-- BODY -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:36px 40px;">
                    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2A2520;">
                      ${t.title}
                    </p>
                    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2A2520;">
                      ${t.intro.replace('{email}', data.userEmail)}
                    </p>
                    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#2A2520;">
                      ${t.explanation}
                    </p>
                    <!-- BLOQUE DE ALERTA -->
                    <div style="background:#FFF5F5;border-left:3px solid #C4623A;border-radius:0 12px 12px 0;padding:20px 24px;margin-bottom:28px;">
                      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#2A2520;">
                        ${t.boxTitle.replace('{email}', data.userEmail)}
                      </p>
                      <p style="margin:0;font-size:14px;line-height:1.65;color:#6A4040;">
                        ${t.boxText}
                      </p>
                    </div>
                    <!-- BOTÓN -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:8px 0 28px;">
                          <a href="${data.verifyUrl}" style="background-color:#C4623A;color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:100px;font-family:sans-serif;font-weight:600;font-size:16px;display:inline-block;box-shadow:0 4px 12px rgba(196,98,58,0.2);">
                            ${t.button}
                          </a>
                        </td>
                      </tr>
                    </table>
                    <div style="height:1px;background:#EAE4D9;margin-bottom:24px;"></div>
                    <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#9B8B7E;">
                      ${t.falseAlarm}
                    </p>
                    <p style="margin:0;font-size:12px;color:#B0A090;">
                      ${t.expiry}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:28px 16px 8px;">
              <p style="margin:0 0 6px;font-family:Georgia,serif;font-style:italic;font-size:13px;color:#C4623A;">
                ${dict.emails.common.footerSignature}
              </p>
              <p style="margin:0;font-size:11px;color:#A09890;line-height:1.6;">
                <a href="https://carrymywords.com" style="color:#A09890;text-decoration:none;">carrymywords.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return { subject, html };
};

export const getTrustedContactInvitationTemplate = (
  dict: EmailDictionary,
  data: {
    contactFirstName: string;
    senderFullName: string;
    senderFirstName: string;
  }
) => {
  const t = dict.emails.trustedContactInvitation;

  // Use regular replace for the placeholders in the translations
  const replaceAll = (text: string) => {
    if (!text) return '';
    return text
      .replace(/{{contactFirstName}}/g, data.contactFirstName || '')
      .replace(/{{senderFullName}}/g, data.senderFullName || '')
      .replace(/{{senderFirstName}}/g, data.senderFirstName || '')
      .replace(/{{firstName}}/g, data.contactFirstName || ''); // Handle the subject format
  };

  const subject = replaceAll(t?.subject);

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F0EBE3;font-family:Georgia,serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EBE3;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- LOGO -->
        <tr>
          <td align="center" style="padding-bottom:28px;">
            <div style="font-family:Georgia,serif;font-style:italic;font-size:22px;color:#C4623A;letter-spacing:-0.3px;">
              Carry My Words
            </div>
            <div style="font-size:9px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:#C4623A;margin-top:3px;">
              
            </div>
          </td>
        </tr>

        <!-- CARD -->
        <tr>
          <td style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(42,37,32,0.08);">

            <!-- FRANJA TERRACOTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#C4623A;padding:32px 40px 28px;">
                  <div style="font-family:Georgia,serif;font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:10px;">
                    ${replaceAll(t?.preheader)}
                  </div>
                  <div style="font-family:Georgia,serif;font-size:26px;font-weight:600;color:#ffffff;line-height:1.25;">
                    ${t?.heading || ''}
                  </div>
                </td>
              </tr>
            </table>

            <!-- CUERPO -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:36px 40px 0;">

                  <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#2A2520;">
                    ${replaceAll(t?.p1)}
                  </p>
                  <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#2A2520;">
                    ${replaceAll(t?.p2)}
                  </p>

                  <div style="height:1px;background:#F0EBE3;margin-bottom:28px;"></div>

                  <!-- BLOQUE ¿QUÉ SIGNIFICA? -->
                  <div style="background:#FAF7F3;border-left:3px solid #C4623A;border-radius:0 12px 12px 0;padding:20px 24px;margin-bottom:28px;">
                    <div style="font-family:Georgia,serif;font-style:italic;font-size:14px;color:#C4623A;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:10px;">
                      ${t?.roleTitle || ''}
                    </div>
                    <p style="margin:0 0 10px;font-size:14px;line-height:1.65;color:#4A4540;">
                      ${replaceAll(t?.roleP1)}
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.65;color:#4A4540;">
                      ${replaceAll(t?.roleP2)}
                    </p>
                  </div>

                  <!-- BLOQUE VERIFICACIÓN -->
                  <div style="background:#F5F0E8;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
                    <div style="font-size:13px;font-weight:600;color:#2A2520;margin-bottom:8px;">
                      ${t?.moreTitle || ''}
                    </div>
                    <p style="margin:0;font-size:14px;line-height:1.65;color:#6A6560;">
                      ${replaceAll(t?.moreText)}
                    </p>
                  </div>

                  <div style="height:1px;background:#F0EBE3;margin-bottom:28px;"></div>

                  <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#2A2520;">
                    ${t?.thanks || ''}
                  </p>
                  <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#6A6560;font-style:italic;">
                    ${t?.signature || ''}
                  </p>

                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:28px 16px 8px;" align="center">
            <p style="margin:0 0 6px;font-family:Georgia,serif;font-style:italic;font-size:13px;color:#C4623A;">
              ${t?.footerLogo || ''}
            </p>
            <p style="margin:0;font-size:11px;color:#A09890;line-height:1.6;">
              ${t?.footerLegal || ''}
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>
    `;

  return { subject, html };
};

export const getMessageSpecialTemplate = (
  dict: EmailDictionary,
  data: {
    recipientName: string;
    senderName: string;
    messageUrl: string;
  }
) => {
  const t = dict.emails.messageSpecial;

  const replaceAll = (text: string) => {
    if (!text) return '';
    return text
      .replace(/{{RECIPIENT_NAME}}/g, data.recipientName || '')
      .replace(/{{SENDER_NAME}}/g, data.senderName || '')
      .replace(/{{MESSAGE_URL}}/g, data.messageUrl || '');
  };

  const subject = replaceAll(t?.subject);

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F0ECE4;font-family:Georgia,serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0ECE4;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- LOGO -->
        <tr>
          <td align="center" style="padding-bottom:28px;">
            <div style="font-family:Georgia,serif;font-style:italic;font-size:22px;color:#C0522A;letter-spacing:-0.3px;">
              ${dict.emails.common.footerSignature}
            </div>
            <div style="font-size:9px;font-weight:500;letter-spacing:0.35em;text-transform:uppercase;color:#C0522A;margin-top:3px;">
              
            </div>
          </td>
        </tr>

        <!-- CARD -->
        <tr>
          <td style="background:#FAF7F2;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(42,37,32,0.08);">

            <!-- HERO BLOCK -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#C0522A;padding:32px 40px 28px;border-radius:12px 12px 0 0;">
                  <div style="font-family:Georgia,serif;font-size:11px;color:rgba(255,255,255,0.6);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:10px;">
                    ${replaceAll(t?.preheader)}
                  </div>
                  <div style="font-family:Georgia,serif;font-size:30px;font-weight:600;color:#ffffff;line-height:1.25;">
                    ${t?.heading || ''}
                  </div>
                </td>
              </tr>
            </table>

            <!-- CUERPO -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:36px;">

                  <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#2A2520;">
                    ${replaceAll(t?.p1)}
                  </p>
                  <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#2A2520;">
                    ${replaceAll(t?.p2)}
                  </p>

                  <!-- BOTÓN -->
                  <div style="margin-bottom:32px;">
                    <a href="${data.messageUrl}" style="display:inline-block;padding:14px 28px;background:#C0522A;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;">
                      ${t?.button || ''}
                    </a>
                  </div>

                  <div style="height:1px;background:#E0D8CC;margin-bottom:24px;"></div>

                  <!-- INFO TEXT -->
                  <p style="margin:0 0 24px;font-style:italic;font-size:13px;line-height:1.6;color:#7A6050;">
                    ${t?.info || ''}
                  </p>

                  <div style="height:1px;background:#E0D8CC;margin-bottom:24px;"></div>

                  <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#2A2520;">
                    ${t?.closing || ''}
                  </p>
                  <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#6A6560;font-style:italic;">
                    ${t?.signature || ''}
                  </p>

                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:28px 16px 8px;" align="center">
            <p style="margin:0 0 6px;font-family:Georgia,serif;font-style:italic;font-size:13px;color:#C0522A;">
              ${dict.emails.common.footerSignature}
            </p>
            <p style="margin:0;font-size:11px;color:#A08878;line-height:1.6;">
              Recibiste este email porque alguien programó un mensaje especial para vos.<br>
              <a href="https://carrymywords.com" style="color:#A08878;text-decoration:underline;">carrymywords.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>
    `;

  return { subject, html };
};

export const getMessagePosthumousTemplate = (
  dict: EmailDictionary,
  data: {
    recipientName: string;
    senderName: string;
    messageUrl: string;
  }
) => {
  const t = dict.emails.messagePosthumous;

  const replaceAll = (text: string) => {
    if (!text) return '';
    return text
      .replace(/{{RECIPIENT_NAME}}/g, data.recipientName || '')
      .replace(/{{SENDER_NAME}}/g, data.senderName || '')
      .replace(/{{MESSAGE_URL}}/g, data.messageUrl || '');
  };

  const subject = replaceAll(t?.subject);

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F0ECE4;font-family:Georgia,serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0ECE4;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- LOGO -->
        <tr>
          <td align="center" style="padding-bottom:28px;">
            <div style="font-family:Georgia,serif;font-style:italic;font-size:22px;color:#C0522A;letter-spacing:-0.3px;">
              ${dict.emails.common.footerSignature}
            </div>
            <div style="font-size:9px;font-weight:500;letter-spacing:0.35em;text-transform:uppercase;color:#C0522A;margin-top:3px;">
              
            </div>
          </td>
        </tr>

        <!-- CARD -->
        <tr>
          <td style="background:#FAF7F2;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(42,37,32,0.08);">

            <!-- HERO BLOCK -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#3D2C1E;padding:32px 40px 28px;border-radius:12px 12px 0 0;">
                  <div style="font-family:Georgia,serif;font-size:11px;color:rgba(255,255,255,0.6);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:10px;">
                    ${replaceAll(t?.preheader)}
                  </div>
                  <div style="font-family:Georgia,serif;font-size:30px;font-weight:600;color:#ffffff;line-height:1.25;">
                    ${t?.heading || ''}
                  </div>
                </td>
              </tr>
            </table>

            <!-- CUERPO -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:36px;">

                  <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#2A2520;">
                    ${replaceAll(t?.p1)}
                  </p>
                  <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#2A2520;">
                    ${replaceAll(t?.p2)}
                  </p>

                  <!-- BOTÓN -->
                  <div style="margin-bottom:32px;">
                    <a href="${data.messageUrl}" style="display:inline-block;padding:14px 28px;background:#3D2C1E;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;">
                      ${t?.button || ''}
                    </a>
                  </div>

                  <div style="height:1px;background:#E0D8CC;margin-bottom:24px;"></div>

                  <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#2A2520;">
                    ${t?.closing || ''}
                  </p>
                  <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#6A6560;font-style:italic;">
                    — ${dict.emails.common.footerSignature}
                  </p>

                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:28px 16px 8px;" align="center">
            <p style="margin:0 0 6px;font-family:Georgia,serif;font-style:italic;font-size:13px;color:#C0522A;">
              ${dict.emails.common.footerSignature}
            </p>
            <p style="margin:0;font-size:11px;color:#A08878;line-height:1.6;">
              ${t?.footerLegal || ''}<br>
              <a href="https://carrymywords.com" style="color:#A08878;text-decoration:underline;">carrymywords.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>
    `;

  return { subject, html };
};

export const getResetPasswordTemplate = (dict: EmailDictionary, data: { password: string }) => {
  const t = dict.emails.resetPassword;
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F0ECE4;font-family:Georgia,serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0ECE4;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- LOGO -->
        <tr>
          <td align="center" style="padding-bottom:28px;">
            <div style="font-family:Georgia,serif;font-style:italic;font-size:22px;color:#C0522A;letter-spacing:-0.3px;">
              ${dict.emails.common.footerSignature}
            </div>
            <div style="font-size:9px;font-weight:500;letter-spacing:0.35em;text-transform:uppercase;color:#C0522A;margin-top:3px;">
              ${dict.emails.common.tagline}
            </div>
          </td>
        </tr>

        <!-- CARD -->
        <tr>
          <td style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(42,37,32,0.08);">

            <!-- HERO BLOCK -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#C0522A;padding:32px 40px 28px;border-radius:12px 12px 0 0;">
                  <div style="font-family:Georgia,serif;font-size:11px;color:rgba(255,255,255,0.6);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:10px;">
                    ${dict.emails.common.footerSignature.toUpperCase()}
                  </div>
                  <div style="font-family:Georgia,serif;font-size:30px;font-weight:600;color:#ffffff;line-height:1.25;">
                    ${t.title}
                  </div>
                </td>
              </tr>
            </table>

            <!-- CUERPO -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:36px;">
                  
                  <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#2A2520;">
                    ${t.intro}
                  </p>

                  <!-- BLOQUE CONTRASEÑA -->
                  <div style="background:#f4f4f5;border-radius:8px;padding:24px;margin-bottom:24px;text-align:center;border:1px solid #e4e4e7;">
                    <p style="margin:0 0 12px;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">
                      ${t.passwordLabel}
                    </p>
                    <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:32px;font-weight:700;color:#18181b;letter-spacing:0.1em;">
                      ${data.password}
                    </div>
                  </div>

                  <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#C0522A;font-weight:600;text-align:center;">
                    ${t.warning}
                  </p>

                  <div style="height:1px;background:#E0D8CC;margin-bottom:24px;"></div>

                  <!-- INFO TEXT -->
                  <p style="margin:0;font-style:italic;font-size:13px;line-height:1.6;color:#7A6050;">
                    ${t.footer}
                  </p>

                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:28px 16px 8px;" align="center">
            <div style="margin:0 0 6px;font-family:Georgia,serif;font-style:italic;font-size:13px;color:#C0522A;">
              Carry My Words
            </div>
            <p style="margin:0;font-size:11px;color:#A08878;line-height:1.6;">
              <a href="https://carrymywords.com" style="color:#A08878;text-decoration:underline;">carrymywords.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>
`;
  return { subject: t.subject, html };
};

export const getPaymentFailedTemplate = (dict: EmailDictionary, data: { planStatus: string }) => {
  const t = dict.emails.paymentFailed;
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F0ECE4;font-family:Georgia,serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0ECE4;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- LOGO -->
        <tr>
          <td align="center" style="padding-bottom:28px;">
            <div style="font-family:Georgia,serif;font-style:italic;font-size:22px;color:#C0522A;letter-spacing:-0.3px;">
              ${dict.emails.common.footerSignature}
            </div>
            <div style="font-size:9px;font-weight:500;letter-spacing:0.35em;text-transform:uppercase;color:#C0522A;margin-top:3px;">
              
            </div>
          </td>
        </tr>

        <!-- CARD -->
        <tr>
          <td style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(42,37,32,0.08);">

            <!-- HERO BLOCK -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#C0522A;padding:32px 40px 28px;border-radius:12px 12px 0 0;">
                  <div style="font-family:Georgia,serif;font-size:11px;color:rgba(255,255,255,0.6);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:10px;">
                    CARRY MY WORDS
                  </div>
                  <div style="font-family:Georgia,serif;font-size:30px;font-weight:600;color:#ffffff;line-height:1.25;">
                    ${t.title}
                  </div>
                </td>
              </tr>
            </table>

            <!-- CUERPO -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:36px;">
                  
                  <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#2A2520;">
                    ${t.intro.replace('{planStatus}', data.planStatus)}
                  </p>

                  <!-- BOTÓN -->
                  <div style="margin-bottom:32px;text-align:center;">
                    <a href="https://carrymywords.com/dashboard" style="display:inline-block;padding:14px 28px;background:#C0522A;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;">
                      ${t.action}
                    </a>
                  </div>

                  <div style="height:1px;background:#E0D8CC;margin-bottom:24px;"></div>

                  <!-- INFO TEXT -->
                  <p style="margin:0;font-style:italic;font-size:13px;line-height:1.6;color:#7A6050;">
                    ${t.footer}
                  </p>

                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:28px 16px 8px;" align="center">
            <div style="margin:0 0 6px;font-family:Georgia,serif;font-style:italic;font-size:13px;color:#C0522A;">
              ${dict.emails.common.footerSignature}
            </div>
            <p style="margin:0;font-size:11px;color:#A08878;line-height:1.6;">
              <a href="https://carrymywords.com" style="color:#A08878;text-decoration:underline;">carrymywords.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>
`;
  return { subject: t.subject, html };
};
