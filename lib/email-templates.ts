
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
