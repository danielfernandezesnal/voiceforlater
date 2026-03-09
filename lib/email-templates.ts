
// Helper type for the dictionary structure we expect
// Ideally this should be inferred from the JSON files, but for now we define the shape we need
export type EmailDictionary = {
  emails: {
    common: {
      footerSignature: string;
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
  };
};

export const getMagicLinkTemplate = (dict: EmailDictionary, data: { magicLink: string, isAdminLogin: boolean }) => {
  const t = dict.emails.magicLink;
  const subject = data.isAdminLogin ? t.subjectAdmin : t.subject;

  const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #3A4D3F;">${t.title}</h2>
        ${data.isAdminLogin ? `<p style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 10px 0;"><strong>${t.adminBadge}</strong></p>` : ''}
        <p>${t.intro}</p>
        <div style="margin: 30px 0;">
          <a href="${data.magicLink}" style="background-color: #3A4D3F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            ${t.button}
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          ${t.ignore}
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">
          ${data.magicLink}
        </p>
      </div>
    `;

  return { subject, html };
};

export const getMessageDeliveryTemplate = (dict: EmailDictionary, data: { contentHtml: string }) => {
  const t = dict.emails.messageDelivery;
  const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">${t.title}</h2>
            <p>${t.intro}</p>
            ${data.contentHtml}
            <p style="margin-top: 30px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 10px;">
                ${t.footer}
            </p>
        </div>
    `;
  return { subject: t.subject, html };
};

export const getCheckinReminderTemplate = (dict: EmailDictionary, data: { attempts: number, confirmUrl: string }) => {
  const t = dict.emails.checkinReminder;
  const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>${t.title}</h2>
            <p>${t.intro}</p>
            <p>${t.attempt.replace('{attempt}', String(data.attempts))}</p>
            <a href="${data.confirmUrl}" 
               style="display:inline-block;padding:12px 24px;background:#8b5cf6;color:white;text-decoration:none;border-radius:8px;">
              ${t.button}
            </a>
            <p style="color:#666;font-size:12px;margin-top:20px;">
              ${t.warning}
            </p>
        </div>
    `;
  return { subject: t.subject, html };
};

export const getTrustedContactVerifyTemplate = (dict: EmailDictionary, data: { name: string, userEmail: string, verifyUrl: string }) => {
  const t = dict.emails.trustedContactVerify;
  const subject = t.subject.replace('{email}', data.userEmail);

  const greeting = data.name
    ? t.greeting.replace('{name}', data.name)
    : t.greetingUnknown;

  const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>${greeting}</h2>
            <h3 style="color: #3A4D3F;">${t.title}</h3>
            <p>${t.intro.replace('{email}', data.userEmail)}</p>
            <p>${t.explanation}</p>
            
            <div style="margin: 24px 0; padding: 16px; background-color: #fff1f2; border-left: 4px solid #e11d48; border-radius: 4px;">
                <p style="margin: 0; font-weight: bold; color: #9f1239;">${t.boxTitle.replace('{email}', data.userEmail)}</p>
                <p style="margin: 8px 0 0 0; color: #be123c;">${t.boxText}</p>
            </div>

            <a href="${data.verifyUrl}" 
               style="display:inline-block;padding:12px 24px;background:#e11d48;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">
              ${t.button}
            </a>
            
            <p style="margin-top:24px; font-size:14px; color:#666;">
                ${t.falseAlarm}
            </p>
            <p style="font-size:12px; color:#999;">${t.expiry}</p>
            <br/>
            <p>—<br/>
            <strong>Carry My Words</strong></p>
        </div>
    `;
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
              Mensajes que viajan en el tiempo
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
