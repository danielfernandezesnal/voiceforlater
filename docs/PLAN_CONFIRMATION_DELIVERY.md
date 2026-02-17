# Plan de Confirmación de Vida y Envío Real (MVP)

Este documento define la arquitectura y lógica para el mecanismo de "Dead Man's Switch" en VoiceForLater.

## A. Alcance MVP
**Objetivo:** Permitir que un Contacto de Confianza verifique la inactividad del usuario y libere los mensajes programados.

**Lo que SÍ hace:**
- Genera un enlace único y seguro enviado por email al Contacto de Confianza tras el fallo del check-in.
- Provee una interfaz web simple para confirmar ("Liberar mensajes") o denegar ("Falsa alarma").
- Al confirmar: Libera **TODOS** los mensajes del usuario configurados con modo "check-in" (si dejo de confirmar).
- Registra el evento de confirmación para auditoría.

**Lo que NO hace (v1):**
- No permite liberación parcial o granular por mensaje (es todo o nada).
- No requiere autenticación previa del Contacto de Confianza (se basa en la posesión del token seguro del email).
- No tiene flujo de disputa complejo (si se confirma, se envía).

## B. Flujo End-to-End
1.  **Cron (Detección):** El sistema detecta que un usuario ha fallado sus check-ins (3 intentos).
2.  **Notificación (Email):** Se envía un email a los Contactos de Confianza vinculados.
    -   El email contiene un **Token de Acción Único**.
    -   Link: `https://voiceforlater.com/verify-status?token=XYZ...`
3.  **Interfaz (UI):** El contacto accede al link.
    -   Ve una pantalla de advertencia: "¿Confirmas que [Usuario] no está disponible?"
    -   Opciones: [CONFIRMAR Y ENVIAR] (Acción irreversible) | [CANCELAR]
4.  **Confirmación (API):**
    -   Si **CONFIRMA**:
        -   Se marcan los mensajes como "Ready to Deliver" o se envían inmediatamente.
        -   Se notifica al usuario (por si acaso).
        -   Se completa el envío a los Destinatarios Finales.
    -   Si **DENIEGA**:
        -   Se reactiva el check-in del usuario (reset de intentos).
        -   Se notifica al usuario que su contacto indicó que está bien.

## C. Seguridad del Token
El token debe ser robusto para impedir ejecuciones no autorizadas o accidentales.

*   **Formato:** JWT (JSON Web Token) firmado con `SUPABASE_JWT_SECRET` o un secreto específico de servidor.
*   **Payload (Scope):**
    *   `userId`: ID del usuario dueño de la cuenta.
    *   `contactEmail`: Email del contacto que recibe el token.
    *   `action`: 'verify-status'.
    *   `iat`: Issued At (fecha creación).
    *   `exp`: Expiration (ej. 48 horas).
*   **One-Time Use (Replay Prevention):**
    *   Para el MVP, se puede usar un registro en base de datos (`verification_tokens`) que se marca como `used: true` al consumirse.
    *   O bien, validar contra el estado actual del usuario: Si el usuario ya fue "confirmado" o "reactivado", el token ya no es válido para esa acción.

## D. Rutas Previstas
**Frontend (UI):**
*   `/verify-status`
    *   Parámetro query: `?token=...`
    *   Renderiza: Página de alerta y botones de acción.

**Backend (API):**
*   `POST /api/verify-status`
    *   Body: `{ token: string, decision: 'confirm' | 'deny' }`
    *   Valida token.
    *   Ejecuta la lógica de negocio.
    *   Devuelve éxito o error.

## E. Reglas de Release (Envío)
1.  **Selección:** Se seleccionan **TODOS** los mensajes del `userId` donde:
    *   `status` es 'scheduled'.
    *   `delivery_rules.mode` es 'checkin'.
2.  **Idempotencia:**
    *   Antes de enviar, verificar que el mensaje no tenga estado 'delivered' o 'processing'.
    *   Uso de transacciones o bloqueos optimistas si es posible (a nivel de fila).
    *   Si un contacto confirma, y luego otro entra al link, el sistema debe informar "Esta acción ya fue procesada".
3.  **Envío Real:**
    *   Generación de URLs firmadas (para audio/video).
    *   Envío de correos a la tabla `recipients`.
    *   Actualización de estado a 'delivered'.

## F. Auditoría (Logs)
Se recomienda crear una tabla o usar la tabla `events` existente con un tipo específico.

**Tabla Sugerida: `confirmation_events` (o uso de `events` jsonb):**
*   `id`: UUID
*   `user_id`: UUID (Usuario afectado)
*   `contact_email`: String (Quién confirmó)
*   `action`: 'confirmed_death' | 'false_alarm'
*   `ip_address`: String (IP del confirmante)
*   `user_agent`: String (Navegador)
*   `created_at`: Timestamp
*   `token_id`: (Opcional, referencia al token usado)

Esto permite rastrear quién autorizó la liberación de los mensajes y cuándo.
