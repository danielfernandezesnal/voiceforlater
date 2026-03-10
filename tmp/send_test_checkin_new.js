const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

// Mocking some of the logic since we can't easily import the ESM files in this script without issues
const esDict = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', 'es.json'), 'utf8'));

// Re-implementing the logic from lib/email-templates.ts with the NEW HTML
const getCheckinReminderTemplate = (dict, data) => {
    const t = dict.emails.checkinReminder;
    const dashboardUrl = data.confirmUrl;
    const supportUrl = data.confirmUrl.replace('/dashboard', '/contact');

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
    <div class="logo-title">Carry My Words</div>
    <div class="logo-subtitle">Mensajes que viajan en el tiempo</div>
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
        <span class="reply-arrow">↩</span>
        <p>
          <strong>O respondé este mail</strong>
          No hace falta escribir nada. Con responder ya alcanza.
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
    <div class="footer-logo">Carry My Words</div>
    <p>Recibiste este email porque tenés un check-in programado activo.<br>
    <a href="${dashboardUrl}">Configurar frecuencia de check-ins</a> · <a href="${supportUrl}">Soporte</a></p>
  </div>
</div>
</body>
</html>`;
    return { subject: t.subject, html };
};

async function sendTest() {
    const apiKey = 're_23eq4WE5_Jv84bxuoXVGoFthQbJvtJicD';
    const resend = new Resend(apiKey);

    const targetEmail = 'danielfernandezesnal@gmail.com';
    // Use the NEW URL structure
    const confirmUrl = 'https://voiceforlater.vercel.app/dashboard';

    console.log(`Sending NEW check-in reminder to ${targetEmail}...`);

    try {
        const { subject, html } = getCheckinReminderTemplate(esDict, { attempts: 1, confirmUrl });

        await resend.emails.send({
            from: "Carry My Words <no-reply@voiceforlater.com>",
            to: targetEmail,
            subject: subject,
            html: html
        });

        console.log('Email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

sendTest();
