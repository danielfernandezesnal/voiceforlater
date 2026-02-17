# Plan de Implementación: Confirmación de Vida y Envío Real

Este documento detalla la lógica y los pasos necesarios para completar el flujo de "Check-in Falipp" -> "Notificación de Confianza" -> "Confirmación de Incidente" -> "Envío de Mensajes".

## 1. Estado Actual
- **Paso 1 (Check-in):** El usuario recibe recordatorios. Si responde (`/api/checkin/confirm`), el contador se reinicia. (Implementado ✅)
- **Paso 2 (Fallo):** Si el usuario no responde tras 3 intentos, el Cron identifica los contactos de confianza asociados a los mensajes y les envía un email. (Implementado Parcialmente ⚠️ - Falta Token de Acción).
- **Paso 3 (Confirmación de Confianza):** Actualmente, el email es solo informativo. No hay mecanismo para que el contacto confirme el estado del usuario. (Falta ❌)
- **Paso 4 (Envío Real):** El sistema no envía los mensajes finales a los destinatarios. (Falta ❌)

## 2. Arquitectura Propuesta

### A. Generación de Token Seguro (En Cron)
Al momento de notificar a un Contacto de Confianza, el sistema generará un token único (JWT o UUID con expiración) vinculado a ese contacto y a ese evento de check-in fallido.
- **Acción:** Modificar `app/api/cron/process-checkins/route.ts`.
- **Almacenamiento:** Crear tabla `verification_tokens` o almacenar temporalmente en `checkins` (metadata) o usar JWT sin estado (stateless). Recomendado: JWT stateless firmado con `SUPABASE_JWT_SECRET` o similar para evitar DB migrations complejas si es posible, o una tabla simple `verification_requests` si queremos auditar quién confirmó.
    - *Decision MVP:* Token JWT firmado incluido en el enlace del email.
- **Link en Email:** `https://voiceforlater.com/verify-status?token=...`

### B. Interfaz de Verificación (Frontend)
Una página dedicada para el Contacto de Confianza que recibe el token.
- **Ruta:** `app/[locale]/verify-status/page.tsx` (o `app/verify/[token]/page.tsx`).
- **Lógica:**
    1. Valida el token al cargar.
    2. Muestra información (sin revelar mensajes): "¿Confirmas que [Usuario] no está disponible?"
    3. Botones:
        - "Sí, confirmar envío de mensajes" (Rojo/Primario).
        - "No, es una falsa alarma" (Secundario).

### C. API de Confirmación y Envío (Backend)
Endpoint que procesa la decisión del Contacto de Confianza.
- **Ruta:** `POST /api/verify-status`
- **Lógica "Sí":**
    1. Marca el usuario como `confirmed_dead` o `released` en `checkins`.
    2. **Busca todos los mensajes** del usuario con `mode: 'checkin'`.
    3. **Ejecuta el envío** (reutilizando lógica de `process-messages`):
        - Genera Links firmados para Audio/Video.
        - Envía emails a los **Destinatarios Finales** (Recipients).
        - Marca mensajes como `delivered`.
    4. Notifica al Contacto de Confianza que los mensajes han sido liberados.
- **Lógica "No":**
    1. Reinicia el contador de check-ins del usuario (como si el usuario hubiera hecho check-in, pero avisando al usuario).
    2. Notifica al usuario: "Tu contacto de confianza [Nombre] indicó que estás bien".

## 3. Pasos de Implementación Inmediata

1. **Backend (API):** Crear `/api/verify-status` para manejar la confirmación.
2. **Refactorización:** Extraer la lógica de envío de mensajes de `app/api/cron/process-messages/route.ts` a una función reutilizable `sendUserMessages(userId, mode)`.
3. **Frontend:** Crear la página de verificación `app/[locale]/verify-status/page.tsx`.
4. **Cron:** Actualizar `process-checkins` para generar el token e incluir el link en el email.

---
**¿Procedemos con este plan?**
