const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

// Mocking some of the logic since we can't easily import the ESM files in this script without issues
const esDict = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', 'es.json'), 'utf8'));

const getCheckinReminderTemplate = (dict, data) => {
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

async function sendTest() {
    const apiKey = 're_23eq4WE5_Jv84bxuoXVGoFthQbJvtJicD';
    const resend = new Resend(apiKey);

    const targetEmail = 'danielfernandezesnal@gmail.com';
    const confirmUrl = 'http://localhost:3000/api/checkin/confirm'; // placeholder

    console.log(`Sending check-in reminder to ${targetEmail}...`);

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
