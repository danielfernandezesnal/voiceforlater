
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
      eyebrow: string;
      heroTitle: string;
      body: {
        line1: string;
        line2: string;
        line3: string;
        cta: string;
        footer: string;
      };
    };
    checkinReminder2: {
      subject: string;
      eyebrow: string;
      heroTitle: string;
      body: {
        line1: string;
        line2: string;
        line3: string;
        cta: string;
        footer: string;
      };
    };
    checkinReminder3: {
      subject: string;
      eyebrow: string;
      heroTitle: string;
      body: {
        line1: string;
        line2: string;
        line3: string;
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
      linkFallback: string;
      closing: string;
      signature: string;
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
  const titleLines = t.title.replace('{senderFirstName}', data.senderFirstName).split('\n');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;1,400&family=Playfair+Display:ital,wght@1,400&family=Source+Sans+3:wght@300;400;500&display=swap');
    body { margin:0; padding:0; background:#f5f0e8; font-family:'Source Sans 3',Georgia,sans-serif; }
    @media only screen and (max-width:600px) {
      .wrapper { padding: 24px 16px !important; }
      .hero-pad { padding: 36px 28px 0 !important; }
      .htitle { font-size: 28px !important; }
      .orn-pad { padding: 20px 28px !important; }
      .card-inner { padding: 0 28px 28px !important; }
      .footer-pad { padding: 16px 28px !important; }
    }
  </style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" class="wrapper" style="background:#f5f0e8;padding:40px 20px;">
  <tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

    <!-- LOGO -->
    <tr><td align="center" style="padding-bottom:32px;">
      <a href="https://carrymywords.com" style="text-decoration:none;display:inline-block;">
        <img src="https://carrymywords.com/assets/logo-email.png" alt="Carry my Words" width="200" style="display:block;" />
      </a>
    </td></tr>

    <!-- CARD -->
    <tr><td style="background:#fffdf9;border-radius:4px;border:1px solid #e8e0d0;overflow:hidden;">

      <!-- HERO -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="hero-pad" style="padding:48px 48px 0;">
          <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#c4622a;font-weight:500;margin-bottom:16px;">${eyebrow}</div>
          <div class="htitle" style="font-family:'Lora',Georgia,serif;font-size:38px;font-weight:400;color:#1a0e09;line-height:1.18;margin:0;">
            ${titleLines[0]}<br><em style="font-style:italic;color:#c4622a;">${titleLines[1] || ''}</em>
          </div>
        </td></tr>
      </table>

      <!-- SEPARADOR -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="orn-pad" style="padding:28px 48px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="height:1px;background:linear-gradient(to right,transparent,#ddd0bc);"></td>
            <td style="padding:0 12px;font-family:'Lora',serif;font-size:14px;color:#c4622a;opacity:0.55;white-space:nowrap;">◆</td>
            <td style="height:1px;background:linear-gradient(to left,transparent,#ddd0bc);"></td>
          </tr></table>
        </td></tr>
      </table>

      <!-- BODY -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="card-inner" style="padding:0 48px 40px;">
          <p style="font-size:14px;line-height:1.78;color:#4a3728;font-weight:300;margin:0 0 24px;">${t.intro.replace('{senderFirstName}', data.senderFirstName)}</p>

          <!-- BLOQUE ALERTA -->
          <div style="border-left:2px solid #c4622a;padding:16px 20px;margin:0 0 28px;background:#fdf8f3;border-radius:0 4px 4px 0;">
            <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#c4622a;font-weight:500;margin-bottom:8px;">${t.boxTitle.replace('{senderFirstName}', data.senderFirstName)}</div>
            <p style="font-size:13px;line-height:1.72;color:#4a3728;font-weight:300;margin:0;">${t.boxText}</p>
          </div>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0">
            <tr><td>
              <a href="${data.verifyUrl}" style="display:inline-block;background:#c4622a;color:#fff9f4;text-decoration:none;font-family:'Source Sans 3',sans-serif;font-size:12px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;padding:16px 44px;border-radius:2px;">${t.button}</a>
            </td></tr>
          </table>
          <p style="font-size:11px;color:#a08878;margin:12px 0 0;font-weight:300;">${t.secondary}</p>
        </td></tr>
      </table>

    </td></tr>

    <!-- FOOTER -->
    <tr><td class="footer-pad" style="padding:20px 48px;background:#f5efe3;border-top:1px solid #ecdfd0;">
      <p style="font-size:11px;color:#b8a898;font-weight:300;margin:0;line-height:1.65;">${t.tagline}</p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`;

  return { subject, html };
};

export const getTrustedContactInvitationTemplate = (
  dict: EmailDictionary,
  data: { contactFirstName: string; senderFullName: string; senderFirstName: string; }
) => {
  const t = dict.emails.trustedContactInvitation;
  const replaceAll = (text: string) => {
    if (!text) return '';
    return text
      .replace(/{{contactFirstName}}/g, data.contactFirstName || '')
      .replace(/{{senderFullName}}/g, data.senderFullName || '')
      .replace(/{{senderFirstName}}/g, data.senderFirstName || '')
      .replace(/{{firstName}}/g, data.contactFirstName || '');
  };
  const subject = replaceAll(t?.subject);
  const titleLines = (t?.heading || '').split('\n');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;1,400&family=Playfair+Display:ital,wght@1,400&family=Source+Sans+3:wght@300;400;500&display=swap');
    body { margin:0; padding:0; background:#f5f0e8; font-family:'Source Sans 3',Georgia,sans-serif; }
    @media only screen and (max-width:600px) {
      .wrapper { padding: 24px 16px !important; }
      .card-inner { padding: 0 28px 28px !important; }
      .hero-pad { padding: 36px 28px 0 !important; }
      .htitle { font-size: 28px !important; }
      .footer-pad { padding: 16px 28px !important; }
    }
  </style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" class="wrapper" style="background:#f5f0e8;padding:40px 20px;">
  <tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

    <!-- LOGO -->
    <tr><td align="center" style="padding-bottom:32px;">
      <a href="https://carrymywords.com" style="text-decoration:none;display:inline-block;">
        <img src="https://carrymywords.com/assets/logo-email.png" alt="Carry my Words" width="200" style="display:block;" />
      </a>
    </td></tr>

    <!-- CARD -->
    <tr><td style="background:#fffdf9;border-radius:4px;border:1px solid #e8e0d0;overflow:hidden;">

      <!-- HERO -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="hero-pad" style="padding:48px 48px 0;">
          <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#c4622a;font-weight:500;margin-bottom:16px;">${replaceAll('{{senderFirstName}}')} pensó en ti</div>
          <div class="htitle" style="font-family:'Lora',Georgia,serif;font-size:38px;font-weight:400;color:#1a0e09;line-height:1.18;margin:0;">
            ${titleLines[0]}<br><em style="font-style:italic;color:#c4622a;">${titleLines[1] || ''}</em>
          </div>
        </td></tr>
      </table>

      <!-- SEPARADOR -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:28px 48px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="height:1px;background:linear-gradient(to right,transparent,#ddd0bc);"></td>
              <td style="padding:0 12px;font-family:'Lora',serif;font-size:14px;color:#c4622a;opacity:0.55;white-space:nowrap;">◆</td>
              <td style="height:1px;background:linear-gradient(to left,transparent,#ddd0bc);"></td>
            </tr></table>
          </td>
        </tr>
      </table>

      <!-- BODY -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="card-inner" style="padding:0 48px 40px;">
          <p style="font-size:14px;line-height:1.78;color:#4a3728;font-weight:300;margin:0 0 18px;">${replaceAll(t?.p1)}</p>
          <p style="font-size:14px;line-height:1.78;color:#4a3728;font-weight:300;margin:0 0 24px;">${replaceAll(t?.p2)}</p>

          <!-- BLOQUE ROL -->
          <div style="border-left:2px solid #c4622a;padding:14px 18px;margin:0 0 18px;background:#fdf8f3;border-radius:0 4px 4px 0;">
            <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#c4622a;font-weight:500;margin-bottom:10px;">${t?.roleTitle || ''}</div>
            <p style="font-size:13px;line-height:1.72;color:#4a3728;font-weight:300;margin:0 0 8px;">${replaceAll(t?.roleP1)}</p>
            <p style="font-size:13px;line-height:1.72;color:#4a3728;font-weight:300;margin:0;">${replaceAll(t?.roleP2)}</p>
          </div>

          <!-- BLOQUE MÁS INFO -->
          <div style="background:#f5efe3;border-radius:4px;padding:14px 18px;margin:0 0 28px;">
            <div style="font-size:12px;font-weight:500;color:#2c1810;margin-bottom:6px;">${t?.moreTitle || ''}</div>
            <p style="font-size:13px;line-height:1.72;color:#6b5040;font-weight:300;margin:0;">${replaceAll(t?.moreText)}</p>
          </div>

          <!-- SIGN OFF -->
          <div style="border-top:1px solid #f0e8d8;padding-top:20px;">
            <p style="font-size:14px;color:#4a3728;font-weight:300;margin:0 0 6px;">${t?.thanks || ''}</p>
            <p style="font-family:'Lora',Georgia,serif;font-style:italic;font-size:15px;color:#c4622a;margin:0;">${t?.signature || ''}</p>
          </div>
        </td></tr>
      </table>

    </td></tr>

    <!-- FOOTER -->
    <tr><td class="footer-pad" style="padding:20px 48px;">
      <p style="font-size:11px;color:#b8a898;font-weight:300;margin:0;line-height:1.65;">${t?.footerLegal || ''}</p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`;

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
            <a href="https://carrymywords.com" style="text-decoration:none;display:inline-block;">
              <img src="https://carrymywords.com/assets/logo-email.png" alt="Carry my Words" width="200" style="display:block;" />
            </a>
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
  data: { recipientName: string; senderName: string; messageUrl: string; }
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
  const titleLines = replaceAll(t?.heading || '').split('\n');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400;1,500&family=Playfair+Display:ital,wght@1,400&family=Source+Sans+3:wght@300;400;500&display=swap');
    body { margin:0; padding:0; background:#f0ebe3; font-family:'Source Sans 3',Georgia,sans-serif; }
    @media only screen and (max-width:600px) {
      .wrapper { padding: 24px 16px !important; }
      .epigraph-pad { padding: 28px 28px 0 !important; }
      .orn-pad { padding: 20px 28px !important; }
      .hero-pad { padding: 0 28px !important; }
      .htitle { font-size: 26px !important; }
      .card-inner { padding: 20px 28px 32px !important; }
      .sign-off-pad { padding: 20px 28px 24px !important; }
      .footer-pad { padding: 16px 28px !important; }
    }
  </style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" class="wrapper" style="background:#f0ebe3;padding:48px 20px;">
  <tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

    <!-- LOGO -->
    <tr><td align="center" style="padding-bottom:36px;">
      <a href="https://carrymywords.com" style="text-decoration:none;display:inline-block;">
        <img src="https://carrymywords.com/assets/logo-email.png" alt="Carry my Words" width="200" style="display:block;" />
      </a>
    </td></tr>

    <!-- CARD -->
    <tr><td style="background:#fdfaf6;border-radius:4px;border:1px solid #e5ddd0;overflow:hidden;">

      <!-- EPÍGRAFE -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="epigraph-pad" style="padding:36px 48px 0;text-align:center;">
          <p style="font-family:'Lora',Georgia,serif;font-style:italic;font-size:15px;color:#9a8878;line-height:1.6;margin:0;">${t?.epigraph || ''}</p>
        </td></tr>
      </table>

      <!-- SEPARADOR -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="orn-pad" style="padding:24px 48px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="height:1px;background:linear-gradient(to right,transparent,#d8cec0);"></td>
            <td style="padding:0 12px;font-family:'Lora',serif;font-size:12px;color:#b8a898;white-space:nowrap;">◆</td>
            <td style="height:1px;background:linear-gradient(to left,transparent,#d8cec0);"></td>
          </tr></table>
        </td></tr>
      </table>

      <!-- TÍTULO -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="hero-pad" style="padding:0 48px;text-align:center;">
          <div class="htitle" style="font-family:'Lora',Georgia,serif;font-size:34px;font-weight:400;color:#1a0e09;line-height:1.25;margin:0;">
            ${titleLines[0]}<br>${titleLines[1] || ''}
          </div>
        </td></tr>
      </table>

      <!-- BODY -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="card-inner" style="padding:28px 48px 40px;text-align:center;">
          <p style="font-size:14px;line-height:1.85;color:#4a3728;font-weight:300;margin:0 0 20px;">${replaceAll(t?.p1)}</p>
          <p style="font-size:14px;line-height:1.85;color:#4a3728;font-weight:300;margin:0 0 32px;">${replaceAll(t?.p2)}</p>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr><td>
              <a href="${data.messageUrl}" style="display:inline-block;background:#2c1810;color:#fdf8f2;text-decoration:none;font-family:'Source Sans 3',sans-serif;font-size:11px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;padding:15px 44px;border-radius:2px;">${t?.button || ''}</a>
            </td></tr>
          </table>
        </td></tr>
      </table>

      <!-- SIGN OFF -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="sign-off-pad" style="padding:24px 48px 32px;text-align:center;border-top:1px solid #ede5d8;">
          <p style="font-family:'Lora',Georgia,serif;font-style:italic;font-size:15px;color:#6b5040;margin:0 0 10px;">${t?.closing || ''}</p>
          <p style="font-family:'Lora',Georgia,serif;font-style:italic;font-size:14px;color:#c4622a;margin:0;">${t?.signature || ''}</p>
        </td></tr>
      </table>

    </td></tr>

    <!-- FOOTER -->
    <tr><td class="footer-pad" style="padding:20px 48px;background:#f5ede0;border-top:1px solid #e8ddd0;">
      <p style="font-size:11px;color:#9a8070;font-weight:300;margin:0 0 4px;">${t?.linkFallback || ''}</p>
      <a href="${data.messageUrl}" style="font-size:11px;color:#c4622a;word-break:break-all;text-decoration:none;">${data.messageUrl}</a>
      <p style="font-size:11px;color:#b8a898;font-weight:300;margin:8px 0 0;line-height:1.65;">${t?.footerLegal || ''}</p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`;

  return { subject, html };
};

export const getPaymentFailedTemplate = (dict: EmailDictionary, data: { dashboardUrl: string }) => {
  const t = dict.emails.paymentFailed;
  const titleLines = (t.title || '').split('\n');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;1,400&family=Playfair+Display:ital,wght@1,400&family=Source+Sans+3:wght@300;400;500&display=swap');
    body { margin:0; padding:0; background:#f5f0e8; font-family:'Source Sans 3',Georgia,sans-serif; }
    @media only screen and (max-width:600px) {
      .wrapper { padding: 24px 16px !important; }
      .hero-pad { padding: 36px 28px 0 !important; }
      .htitle { font-size: 28px !important; }
      .orn-pad { padding: 20px 28px !important; }
      .card-inner { padding: 0 28px 28px !important; }
      .footer-pad { padding: 16px 28px !important; }
    }
  </style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" class="wrapper" style="background:#f5f0e8;padding:40px 20px;">
  <tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

    <!-- LOGO -->
    <tr><td align="center" style="padding-bottom:32px;">
      <a href="https://carrymywords.com" style="text-decoration:none;display:inline-block;">
        <img src="https://carrymywords.com/assets/logo-email.png" alt="Carry my Words" width="200" style="display:block;" />
      </a>
    </td></tr>

    <!-- CARD -->
    <tr><td style="background:#fffdf9;border-radius:4px;border:1px solid #e8e0d0;overflow:hidden;">

      <!-- HERO -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="hero-pad" style="padding:48px 48px 0;">
          <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#c4622a;font-weight:500;margin-bottom:16px;">${t.eyebrow}</div>
          <div class="htitle" style="font-family:'Lora',Georgia,serif;font-size:38px;font-weight:400;color:#1a0e09;line-height:1.18;margin:0;">
            ${titleLines[0]}<br><em style="font-style:italic;color:#c4622a;">${titleLines[1] || ''}</em>
          </div>
        </td></tr>
      </table>

      <!-- SEPARADOR -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="orn-pad" style="padding:28px 48px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="height:1px;background:linear-gradient(to right,transparent,#ddd0bc);"></td>
            <td style="padding:0 12px;font-family:'Lora',serif;font-size:14px;color:#c4622a;opacity:0.55;white-space:nowrap;">◆</td>
            <td style="height:1px;background:linear-gradient(to left,transparent,#ddd0bc);"></td>
          </tr></table>
        </td></tr>
      </table>

      <!-- BODY -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="card-inner" style="padding:0 48px 40px;">
          <p style="font-size:14px;line-height:1.78;color:#4a3728;font-weight:300;margin:0 0 28px;">${t.intro}</p>
          <table cellpadding="0" cellspacing="0">
            <tr><td>
              <a href="${data.dashboardUrl}" style="display:inline-block;background:#c4622a;color:#fff9f4;text-decoration:none;font-family:'Source Sans 3',sans-serif;font-size:12px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;padding:16px 44px;border-radius:2px;">${t.action}</a>
            </td></tr>
          </table>
          <p style="font-size:11px;color:#a08878;margin:12px 0 0;font-weight:300;">${t.footer}</p>
        </td></tr>
      </table>

    </td></tr>

    <!-- FOOTER -->
    <tr><td class="footer-pad" style="padding:20px 48px;background:#f5efe3;border-top:1px solid #ecdfd0;">
      <p style="font-size:11px;color:#b8a898;font-weight:300;margin:0;line-height:1.65;">${t.tagline}</p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`;

  return { subject: t.subject, html };
};