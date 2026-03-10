const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.vercel.prod' });

const esDict = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', 'es.json'), 'utf8'));

// Simulating the logic from getMessagePosthumousTemplate in lib/email-templates.ts
const getMessagePosthumousTemplate = (dict, data) => {
    const t = dict.emails.messagePosthumous;

    const replaceAll = (text) => {
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
              Carry My Words
            </div>
            <div style="font-size:9px;font-weight:500;letter-spacing:0.35em;text-transform:uppercase;color:#C0522A;margin-top:3px;">
              MENSAJES QUE VIAJAN EN EL TIEMPO
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
                    — El equipo de Carry My Words
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
              Carry My Words
            </p>
            <p style="margin:0;font-size:11px;color:#A08878;line-height:1.6;">
              ${t?.footerLegal || ''}<br>
              <a href="https://voiceforlater.vercel.app" style="color:#A08878;text-decoration:underline;">voiceforlater.vercel.app</a>
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

async function sendStoredMessage() {
    const apiKey = process.env.RESEND_API_KEY;
    const resend = new Resend(apiKey);

    // Data from the real message found in the DB
    const data = {
        recipientName: "Virginia Barsco",
        senderName: "Daniel Fernandez",
        messageUrl: "https://voiceforlater.vercel.app/messages/44108bc7-16e0-4745-a991-079e1866e9b4"
    };

    const targetEmail = 'danielfernandezesnal@gmail.com';

    console.log(`Simulating delivery of stored message to ${targetEmail}...`);

    try {
        const { subject, html } = getMessagePosthumousTemplate(esDict, data);

        await resend.emails.send({
            from: "Carry My Words <no-reply@voiceforlater.com>",
            to: targetEmail,
            subject: subject,
            html: html
        });

        console.log('Stored message email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

sendStoredMessage();
