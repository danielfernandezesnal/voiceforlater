
// Helper type for the dictionary structure we expect
// Ideally this should be inferred from the JSON files, but for now we define the shape we need
export type EmailDictionary = {
  emails: {
    common: {
      footerSignature: string;
      tagline: string;
      externalFooter: string;
      dashboardLink: string;
      supportLink: string;
    };
    checkinReminder1: {
      subject: string;
      body: {
        line1: string;
        line2: string;
        line3: string;
        line4: string;
        cta: string;
        footer: string;
      };
    };
    checkinReminder2: {
      subject: string;
      body: {
        line1: string;
        line2: string;
        line3: string;
        line4: string;
        cta: string;
        footer: string;
      };
    };
    checkinReminder3: {
      subject: string;
      body: {
        line1: string;
        line2: string;
        line3: string;
        line4: string;
        cta: string;
        footer: string;
      };
    };
    trustedContactNotify: {
      subject: string;
      title: string;
      intro: string;
      body: string;
      button: string;
      secondary: string;
      ignore: string;
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
      linkFallback: string;
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








export const getTrustedContactVerifyTemplate = (dict: EmailDictionary, data: { contactFirstName: string, senderFirstName: string, verifyUrl: string }) => {
  const t = dict.emails.trustedContactVerify;
  const subject = t.subject.replace('{senderFirstName}', data.senderFirstName);

  const eyebrow = data.contactFirstName
    ? t.eyebrow.replace('{contactFirstName}', data.contactFirstName)
    : t.eyebrowUnknown;

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
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:650px;">
          <!-- CARD -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(196,98,58,0.08);">
              <!-- HEADER -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#C4623A;padding:32px 48px 28px;">
                    <div style="font-family:Georgia,serif;font-style:italic;font-size:24px;color:#ffffff;margin-bottom:16px;">
                      Carry my Words
                    </div>
                    <div style="font-family:Georgia,serif;font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:10px;">
                      ${eyebrow}
                    </div>
                    <div style="font-family:Georgia,serif;font-size:26px;font-weight:600;color:#ffffff;line-height:1.25;">
                      ${t.title.replace('{senderFirstName}', data.senderFirstName)}
                    </div>
                  </td>
                </tr>
              </table>
              <!-- BODY -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 48px;">
                    <p style="margin:0 0 28px;font-size:17px;line-height:1.7;color:#2A2520;">
                      ${t.intro.replace('{senderFirstName}', data.senderFirstName)}
                    </p>
                    <!-- BLOQUE DE ALERTA -->
                    <div style="background:#FFF5F5;border-left:3px solid #C4623A;border-radius:0 12px 12px 0;padding:20px 24px;margin-bottom:28px;">
                      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#C4623A;">
                        ${t.boxTitle.replace('{senderFirstName}', data.senderFirstName)}
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
                    <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#9B8B7E;text-align:center;">
                      ${t.secondary}
                    </p>
                    <div style="height:1px;background:#EAE4D9;margin-bottom:24px;"></div>
                    <p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:14px;color:#C4623A;text-align:center;">
                      ${t.tagline}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:28px 16px 8px;">
              <p style="margin:0 0 8px;font-family:Georgia,serif;font-style:italic;font-size:14px;color:#C4623A;font-weight:600;">
                Carry my Words
              </p>
              <p style="margin:0;font-size:11px;color:#9B8B7E;line-height:1.6;">
                <a href="https://carrymywords.com" style="color:#9B8B7E;text-decoration:none;">${dict.emails.common.externalFooter}</a>
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
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:650px;">

        <!-- LOGO -->
        <tr>
          <td align="center" style="padding-bottom:28px;">
            <div style="font-family:Georgia,serif;font-style:italic;font-size:30px;color:#C4623A;letter-spacing:-0.3px;">
              Carry my Words
            </div>
            <div style="font-size:11px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:#C4623A;margin-top:6px;">
              ${dict.emails.common.tagline}
            </div>
          </td>
        </tr>

        <!-- CARD -->
        <tr>
          <td style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(42,37,32,0.08);">

            <!-- FRANJA TERRACOTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#C4623A;padding:32px 48px 28px;">
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
                <td style="padding:40px 48px 0;">

                  <p style="margin:0 0 20px;font-size:17px;line-height:1.7;color:#2A2520;">
                    ${replaceAll(t?.p1)}
                  </p>
                  <p style="margin:0 0 28px;font-size:17px;line-height:1.7;color:#2A2520;">
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

                  <p style="margin:0 0 8px;font-size:17px;line-height:1.7;color:#2A2520;">
                    ${t?.thanks || ''}
                  </p>
                  <p style="margin:0 0 16px;font-size:17px;line-height:1.7;color:#6A6560;font-style:italic;">
                    ${t?.signature || ''}
                  </p>

                  <div style="height:1px;background:#EAE4D9;margin-bottom:24px;"></div>
                  <p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:14px;color:#C4623A;text-align:center;">
                    ${t.tagline}
                  </p>

                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:28px 16px 8px;" align="center">
            <div style="margin:0 0 8px;font-family:Georgia,serif;font-style:italic;font-size:14px;color:#C4623A;font-weight:600;">
              Carry my Words
            </div>
            <p style="margin:0;font-size:11px;color:#9B8B7E;line-height:1.6;">
              <a href="https://carrymywords.com" style="color:#9B8B7E;text-decoration:none;">${dict.emails.common.externalFooter}</a>
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
  const headingLines = (t?.heading || '').split('\n');

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Source Sans 3',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

        <!-- LOGO -->
        <tr>
          <td align="center" style="padding-bottom:32px;">
            <a href="https://carrymywords.com" style="text-decoration:none;">
              <div style="font-family:'Lora',Georgia,serif;font-style:italic;font-size:24px;color:#c4622a;margin-bottom:5px;">
                ${dict.emails.common.footerSignature}
              </div>
            </a>
            <div style="font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:#c4724a;font-weight:400;">
              ${dict.emails.common.tagline}
            </div>
          </td>
        </tr>

        <!-- CARD -->
        <tr>
          <td style="background:#fffdf9;border-radius:4px;border:1px solid #e8e0d0;overflow:hidden;">

            <!-- HERO -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#fffdf9;padding:48px 48px 0;">
                  <p style="margin:0 0 16px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#c4622a;font-weight:500;">
                    ${replaceAll(t?.preheader)}
                  </p>
                  <h1 style="font-family:'Lora',Georgia,serif;font-size:38px;font-weight:400;color:#1a0e09;line-height:1.18;margin:0;">
                    ${headingLines[0]}${headingLines[1] ? `<br><em style="font-style:italic;color:#c4622a;">${headingLines[1]}</em>` : ''}
                  </h1>
                </td>
              </tr>
            </table>

            <!-- ORNAMENT -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:28px 48px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="height:1px;background:#ddd0bc;"></td>
                      <td style="width:1px;padding:0 12px;font-family:'Lora',serif;font-size:14px;color:#c4622a;opacity:0.55;white-space:nowrap;">◆</td>
                      <td style="height:1px;background:#ddd0bc;"></td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- BODY -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:0 48px 40px;">
                  <p style="margin:0 0 28px;font-size:14px;line-height:1.78;color:#4a3728;font-weight:300;">
                    ${replaceAll(t?.p1)}
                  </p>
                  <p style="margin:0 0 32px;font-size:14px;line-height:1.78;color:#4a3728;font-weight:300;">
                    ${replaceAll(t?.p2)}
                  </p>
                  <a href="${data.messageUrl}" style="display:inline-block;background:#c4622a;color:#fff9f4;border-radius:2px;padding:16px 44px;font-size:12px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;">
                    ${t?.button || ''}
                  </a>
                </td>
              </tr>
            </table>

            <!-- SIGN-OFF -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:0 48px 40px;">
                  <div style="height:1px;background:#eae4d9;margin-bottom:24px;"></div>
                  <p style="margin:0 0 8px;font-size:14px;line-height:1.78;color:#4a3728;font-weight:300;">
                    ${t?.closing || ''}
                  </p>
                  <p style="margin:0 0 24px;font-size:14px;line-height:1.78;color:#9b8b7e;font-style:italic;">
                    ${t?.signature || ''}
                  </p>
                  <p style="margin:0;font-family:'Lora',Georgia,serif;font-style:italic;font-size:14px;color:#c4622a;text-align:center;">
                    ${t?.tagline || ''}
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f5efe3;border-top:1px solid #ecdfd0;padding:24px 48px;">
            <p style="margin:0 0 14px;font-size:11px;color:#9a8070;line-height:1.65;font-weight:300;">
              ${t?.linkFallback || ''}<br>
              <a href="${data.messageUrl}" style="color:#c4622a;word-break:break-all;text-decoration:none;">${data.messageUrl}</a>
            </p>
            <div style="font-family:'Lora',Georgia,serif;font-style:italic;font-size:12px;color:#b09070;letter-spacing:0.04em;">
              ${dict.emails.common.tagline}
            </div>
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
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:650px;">

        <!-- LOGO -->
        <tr>
          <td align="center" style="padding-bottom:28px;">
            <div style="font-family:Georgia,serif;font-style:italic;font-size:30px;color:#C4623A;letter-spacing:-0.3px;">
              ${dict.emails.common.footerSignature}
            </div>
            <div style="font-size:11px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:#C4623A;margin-top:6px;">
              ${dict.emails.common.tagline}
            </div>
          </td>
        </tr>

        <!-- CARD -->
        <tr>
          <td style="background:#FAF7F2;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(42,37,32,0.08);">

            <!-- HERO BLOCK -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#C4623A;padding:32px 48px 28px;border-radius:12px 12px 0 0;">
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
                <td style="padding:48px;">

                  <p style="margin:0 0 32px;font-family:Georgia,serif;font-style:italic;font-size:13px;color:#999;text-align:center;">
                    ${t?.epigraph || ''}
                  </p>

                  <p style="margin:0 0 20px;font-size:17px;line-height:1.7;color:#2A2520;">
                    ${replaceAll(t?.p1)}
                  </p>
                  <p style="margin:0 0 32px;font-size:17px;line-height:1.7;color:#2A2520;">
                    ${replaceAll(t?.p2)}
                  </p>

                  <!-- BOTÓN -->
                  <div style="margin-bottom:32px;text-align:center;">
                    <a href="${data.messageUrl}" style="background-color:#C4623A;color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:100px;font-family:sans-serif;font-weight:600;font-size:16px;display:inline-block;box-shadow:0 4px 12px rgba(196,98,58,0.2);">
                      ${t?.button || ''}
                    </a>
                  </div>

                  <div style="height:1px;background:#E0D8CC;margin-bottom:24px;"></div>

                  <p style="margin:0 0 8px;font-size:17px;line-height:1.7;color:#2A2520;">
                    ${t?.closing || ''}
                  </p>
                  <p style="margin:0 0 16px;font-size:17px;line-height:1.7;color:#6A6560;font-style:italic;">
                    — ${dict.emails.common.footerSignature}
                  </p>

                  <div style="height:1px;background:#EAE4D9;margin-bottom:24px;"></div>
                  <p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:14px;color:#C4623A;text-align:center;">
                    ${t.tagline}
                  </p>

                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:28px 16px 8px;" align="center">
            <p style="margin:0 0 8px;font-family:Georgia,serif;font-style:italic;font-size:14px;color:#C4623A;font-weight:600;">
              Carry my Words
            </p>
            <p style="margin:0;font-size:11px;color:#9B8B7E;line-height:1.6;">
              ${t?.footerLegal || ''}<br>
              <a href="https://carrymywords.com" style="color:#9B8B7E;text-decoration:none;">${dict.emails.common.externalFooter}</a>
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

export const getPaymentFailedTemplate = (dict: EmailDictionary, data: { dashboardUrl: string }) => {
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
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:650px;">

        <!-- CARD -->
        <tr>
          <td style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(42,37,32,0.08);">

            <!-- HEADER -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#C4623A;padding:32px 48px 28px;">
                  <div style="font-family:Georgia,serif;font-style:italic;font-size:24px;color:#ffffff;margin-bottom:16px;">
                    Carry my Words
                  </div>
                  <div style="font-family:Georgia,serif;font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:10px;">
                    ${t.eyebrow}
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
                <td style="padding:48px;">

                  <p style="margin:0 0 32px;font-size:17px;line-height:1.7;color:#2D2D2D;">
                    ${t.intro}
                  </p>

                  <!-- BOTÓN -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding:8px 0 24px;">
                        <a href="${data.dashboardUrl}" style="background-color:#C4623A;color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:100px;font-family:sans-serif;font-weight:600;font-size:16px;display:inline-block;box-shadow:0 4px 12px rgba(196,98,58,0.2);">
                          ${t.action}
                        </a>
                      </td>
                    </tr>
                  </table>

                  <div style="height:1px;background:#EAE4D9;margin-bottom:24px;"></div>

                  <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#9B8B7E;text-align:center;">
                    ${t.footer}
                  </p>
                  <div style="height:1px;background:#EAE4D9;margin-bottom:24px;"></div>
                  <p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:14px;color:#C4623A;text-align:center;">
                    ${t.tagline}
                  </p>

                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:28px 16px 8px;" align="center">
            <div style="margin:0 0 8px;font-family:Georgia,serif;font-style:italic;font-size:14px;color:#C4623A;font-weight:600;">
              Carry my Words
            </div>
            <p style="margin:0;font-size:11px;color:#9B8B7E;line-height:1.6;">
              <a href="https://carrymywords.com" style="color:#9B8B7E;text-decoration:none;">${dict.emails.common.externalFooter}</a>
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
