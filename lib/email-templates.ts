
interface EmailTemplate {
    subject: string;
    html: (data: any) => string;
}

const templates = {
    checkin_reminder: {
        en: {
            subject: "⏰ Check-in reminder - VoiceForLater",
            html: (data: { attempts: number, confirmUrl: string }) => `
                <h2>Time to check in!</h2>
                <p>Your scheduled check-in is overdue. Please confirm you're still active.</p>
                <p>Attempt ${data.attempts} of 3</p>
                <a href="${data.confirmUrl}" 
                   style="display:inline-block;padding:12px 24px;background:#8b5cf6;color:white;text-decoration:none;border-radius:8px;">
                  Confirm I'm Active
                </a>
                <p style="color:#666;font-size:12px;margin-top:20px;">
                  If you don't respond after 3 attempts, we'll contact your trusted contact.
                </p>
            `
        },
        es: {
            subject: "⏰ Recordatorio de check-in - VoiceForLater",
            html: (data: { attempts: number, confirmUrl: string }) => `
                <h2>¡Es hora de reportarse!</h2>
                <p>Tu check-in programado está vencido. Por favor confirma que estás activo.</p>
                <p>Intento ${data.attempts} de 3</p>
                <a href="${data.confirmUrl}" 
                   style="display:inline-block;padding:12px 24px;background:#8b5cf6;color:white;text-decoration:none;border-radius:8px;">
                  Confirmar Actividad
                </a>
                <p style="color:#666;font-size:12px;margin-top:20px;">
                  Si no respondes después de 3 intentos, contactaremos a tu persona de confianza.
                </p>
            `
        }
    },
    trusted_contact_verify: {
        en: {
            subject: (data: { userEmail: string }) => `ACTION REQUIRED: Confirm status for ${data.userEmail}`,
            html: (data: { name: string, userEmail: string, verifyUrl: string }) => `
                <h2>${data.name ? `Hello ${data.name},` : 'Hello,'}</h2>
                <h3 style="color: #6366f1;">Action Required: Verify Status</h3>
                <p>${data.userEmail} has missed their scheduled check-ins on VoiceForLater.</p>
                <p>As a trusted contact, we need you to verify if they are unable to access their account.</p>
                
                <div style="margin: 24px 0; padding: 16px; background-color: #fff1f2; border-left: 4px solid #e11d48; border-radius: 4px;">
                    <p style="margin: 0; font-weight: bold; color: #9f1239;">Is ${data.userEmail} unavailable?</p>
                    <p style="margin: 8px 0 0 0; color: #be123c;">If you confirm, their scheduled messages will be released to recipients.</p>
                </div>

                <a href="${data.verifyUrl}" 
                   style="display:inline-block;padding:12px 24px;background:#e11d48;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">
                  Verify Status Now
                </a>
                
                <p style="margin-top:24px; font-size:14px; color:#666;">
                    If this is a false alarm or you know they are fine, please use the link above to report it secure and stop further notifications.
                </p>
                <p style="font-size:12px; color:#999;">Link expires in 48 hours.</p>
                <br/>
                <p>—<br/>
                <strong>VoiceForLater</strong></p>
            `
        },
        es: {
            subject: (data: { userEmail: string }) => `ACCIÓN REQUERIDA: Confirmar estado de ${data.userEmail}`,
            html: (data: { name: string, userEmail: string, verifyUrl: string }) => `
                <h2>${data.name ? `Hola ${data.name},` : 'Hola,'}</h2>
                <h3 style="color: #6366f1;">Acción Requerida: Verificar Estado</h3>
                <p>${data.userEmail} ha perdido sus check-ins programados en VoiceForLater.</p>
                <p>Como contacto de confianza, necesitamos que verifiques si no pueden acceder a su cuenta.</p>
                
                <div style="margin: 24px 0; padding: 16px; background-color: #fff1f2; border-left: 4px solid #e11d48; border-radius: 4px;">
                    <p style="margin: 0; font-weight: bold; color: #9f1239;">¿${data.userEmail} no está disponible?</p>
                    <p style="margin: 8px 0 0 0; color: #be123c;">Si confirmas, sus mensajes programados serán liberados a los destinatarios.</p>
                </div>

                <a href="${data.verifyUrl}" 
                   style="display:inline-block;padding:12px 24px;background:#e11d48;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">
                  Verificar Estado Ahora
                </a>
                
                <p style="margin-top:24px; font-size:14px; color:#666;">
                    Si es una falsa alarma o sabes que están bien, por favor usa el enlace de arriba para reportarlo de forma segura y detener más notificaciones.
                </p>
                <p style="font-size:12px; color:#999;">El enlace expira en 48 horas.</p>
                <br/>
                <p>—<br/>
                <strong>VoiceForLater</strong></p>
            `
        }
    },
    message_delivery: {
        en: {
            subject: "You have a message via VoiceForLater",
            html: (data: { contentHtml: string }) => `
                <h2>You have a message from VoiceForLater</h2>
                <p>A message scheduled for you has arrived.</p>
                ${data.contentHtml}
                <p style="margin-top: 30px; font-size: 12px; color: #888;">
                    VoiceForLater - Messages for when it truly matters.
                </p>
            `
        },
        es: {
            subject: "Tienes un mensaje vía VoiceForLater",
            html: (data: { contentHtml: string }) => `
                <h2>Tienes un mensaje de VoiceForLater</h2>
                <p>Ha llegado un mensaje programado para ti.</p>
                ${data.contentHtml}
                <p style="margin-top: 30px; font-size: 12px; color: #888;">
                    VoiceForLater - Mensajes para cuando realmente importa.
                </p>
            `
        }
    }
};

export function getEmailTemplate(type: keyof typeof templates, locale: string | null) {
    const lang = (locale === 'es' || locale === 'en') ? locale : 'es'; // Default to ES if unknown, or match project default
    return templates[type][lang];
}
