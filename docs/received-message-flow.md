# Flujo de mensajes recibidos

Flujo end-to-end desde el email de entrega hasta la apertura automática del mensaje en el dashboard.

---

## 1. Objetivo del flujo

Cuando un mensaje llega a su fecha de entrega, el cron lo marca como `delivered`, genera un token de acceso y envía un email al destinatario. El flujo completo tiene un único objetivo: **llevar al destinatario desde ese email hasta el mensaje abierto**, sin fricción, preservando el destino a través de login y set-password si aplica.

Desde el punto de vista del destinatario:
- Recibe un email personalizado con el nombre del remitente.
- Hace clic una vez.
- Si ya tiene sesión activa con el email correcto: llega directo al mensaje abierto.
- Si no tiene sesión: inicia sesión (o crea cuenta) y llega al mensaje abierto.
- En ningún caso tiene que buscar el mensaje manualmente.

---

## 2. Flujo feliz completo

```
Email recibido
  └─ botón "Ver mi mensaje"  →  /{locale}/recibir/{token}
       │
       ├─ [usuario ya logueado con email correcto]
       │     └─ redirect  →  /{locale}/dashboard/received?open={token}
       │
       └─ [usuario no logueado, o logueado con email incorrecto]
             └─ página de bienvenida con dos botones:
                  "Crear cuenta"  →  /{locale}/auth/login?next=/{locale}/recibir/{token}
                  "Ya tengo cuenta"  →  /{locale}/auth/login?next=/{locale}/recibir/{token}
                        │
                        ├─ [login exitoso]
                        │     └─ redirect  →  next  →  /{locale}/recibir/{token}
                        │           └─ email coincide
                        │                 └─ redirect  →  /{locale}/dashboard/received?open={token}
                        │
                        └─ [usuario nuevo / sin contraseña — auth_password_set = false, no OAuth]
                              └─ dashboard layout intercepta
                                    └─ redirect  →  /{locale}/auth/set-password?next=...received?open={token}
                                          └─ set password exitoso
                                                └─ redirect  →  /{locale}/dashboard/received?open={token}
                                                      └─ auto-open del mensaje
```

**Pasos en detalle:**

1. El cron (`/api/cron/process-messages`) detecta el mensaje elegible, genera `delivery_tokens.token` (hex de 64 chars, 15 días de vigencia) y envía el email usando `recipients.email` como destino.

2. El email contiene el botón "Ver mi mensaje" apuntando a `/{locale}/recibir/{token}`. También incluye un link alternativo visible con la misma URL (PR #402).

3. `recibir/{token}` (Server Component, usa `getAdminClient()` para bypass de RLS):
   - Busca el token en `delivery_tokens` con join a `recipients(email)`.
   - Si no existe → `redirect(login?error=invalid_token)`.
   - Si expiró (`expires_at < now`) → `redirect(login?error=expired_token)`.
   - Si el usuario está autenticado y su email coincide con `recipients.email` (normalizado) → `redirect(dashboard/received?open={token})`.
   - En cualquier otro caso → muestra página de bienvenida con los dos botones.

4. Los botones de la página de bienvenida apuntan a `login?next=encodeURIComponent(/{locale}/recibir/{token})`. Ambos botones apuntan a la misma URL (crear cuenta y ya tengo cuenta usan el mismo flujo de login/magic-link).

5. `LoginForm` guarda el valor de `next` en una cookie `pending_intent` (max-age=3600) al montarse. Esto preserva el destino si el flujo forzado a set-password interrumpe la prop `next`.

6. Tras login exitoso, `LoginForm` hace `router.push(next)`, que es `/{locale}/recibir/{token}`.

7. `recibir/{token}` se ejecuta de nuevo. Ahora el usuario está autenticado → email coincide → `redirect(dashboard/received?open={token})`.

8. El layout del dashboard (`app/[locale]/dashboard/layout.tsx`) intercepta si `profile.auth_password_set === false` y el usuario no es OAuth. En ese caso:
   - Lee la URL original desde los headers `x-pathname` + `x-search` (inyectados por middleware).
   - Hace `redirect(set-password?next=encodeURIComponent(/{locale}/dashboard/received?open={token}))`.

9. `SetPasswordForm`, tras éxito:
   - Intenta `next` prop → cookie `pending_intent` → fallback a `/{locale}/dashboard`.
   - En el flujo normal, `next` está presente y lleva directo a `dashboard/received?open={token}`.

10. `dashboard/received/page.tsx` (Client Component) lee `searchParams.open` y lo pasa como `openToken` a `ReceivedMessageList`.

11. `ReceivedMessageList` pasa `autoOpen={openToken === msg.token}` a cada `ReceivedMessageCard`. La tarjeta con token coincidente abre el modal automáticamente.

---

## 3. Rutas involucradas

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/{locale}/recibir/{token}` | Server Component | Valida token, redirige según estado del usuario |
| `/{locale}/auth/login` | Server Component + Client Form | Login / registro / magic link. Recibe y preserva `?next`. |
| `/{locale}/auth/set-password` | Server Component + Client Form | Set password para usuarios nuevos sin OAuth. Recibe y preserva `?next`. |
| `/{locale}/dashboard/received?open={token}` | Client Component | Lista mensajes recibidos. `?open` dispara auto-apertura. |
| `/auth/callback` | Route Handler | Callback OAuth (Google). Recibe `?redirect_to` y redirige. No interviene en el flujo de recibir por token. |

---

## 4. Datos y tablas involucradas

### `delivery_tokens`
| Campo | Descripción |
|-------|-------------|
| `token` | String hex de 64 chars generado con `crypto.randomBytes(32)` |
| `message_id` | FK a `messages.id` |
| `recipient_id` | FK a `recipients.id` — fuente de verdad para el email del destinatario |
| `expires_at` | 15 días desde la creación del token |

### `recipients`
| Campo | Descripción |
|-------|-------------|
| `id` | PK |
| `email` | Email del destinatario — usado para la validación de identidad |

### `messages`
| Campo | Descripción |
|-------|-------------|
| `status` | `'delivered'` para mensajes ya enviados |
| `type` | `'text'`, `'audio'`, `'video'` |
| `owner_id` | FK a `profiles.id` (remitente) |
| `delivery_claimed_at` | Timestamp de claim del cron; se usa como `delivered_at` |

### `profiles`
| Campo | Descripción |
|-------|-------------|
| `auth_password_set` | `false` si el usuario nunca asignó contraseña (requiere set-password) |
| `first_name`, `last_name` | Nombre del remitente mostrado en el modal |

### Storage buckets
- `audio`: archivos de mensajes de audio (ruta en `messages.audio_path`)
- `videos`: archivos de mensajes de video (ruta en `messages.audio_path` también, mismo campo)

> Los archivos de media se sirven vía `/api/messages/{id}/media` y `/api/messages/download`.

---

## 5. Token correcto

El token del link es `delivery_tokens.token`.

La tabla `delivery_tokens` **no** almacena directamente el email del destinatario. Para obtener el email, hay que hacer join con `recipients`:

```typescript
// recibir/[token]/page.tsx
const { data: deliveryToken } = await supabase
    .from('delivery_tokens')
    .select('message_id, expires_at, recipients(email)')
    .eq('token', token)
    .single();
```

El email del destinatario es `deliveryToken.recipients.email` (o `deliveryToken.recipients[0].email` si la relación devuelve array).

### Bug histórico (pre PR #398)

La versión anterior validaba el email del destinatario contra un campo `delivery_tokens.recipient_email` que se guardaba al momento de crear el token.

**Por qué estaba mal:** para mensajes programados por cron, ese campo podía quedar desactualizado o no reflejar el email real en `recipients`. El dato confiable es siempre `recipients.email` (fuente de verdad del schema). El fix de PR #398 eliminó la validación contra `recipient_email` y la reemplazó por el join con `recipients`.

---

## 6. Validación de destinatario

La validación se hace en `recibir/[token]/page.tsx`:

```typescript
if (
    user &&
    user.email &&
    recipientEmail &&
    user.email.trim().toLowerCase() === recipientEmail.trim().toLowerCase()
) {
    redirect(`/${locale}/dashboard/received?open=${token}`);
}
```

Ambos lados se normalizan con `.trim().toLowerCase()` antes de comparar. Si no coinciden, el usuario ve la página de bienvenida (no hay mensaje de error específico por "email incorrecto" — la página actúa como si el usuario no estuviera logueado).

---

## 7. Auto-open

El mecanismo de auto-apertura funciona así:

1. `dashboard/received/page.tsx` lee `searchParams.open` (el token del URL).
2. La query de mensajes incluye `delivery_tokens!left(token)` — trae el token de cada mensaje.
3. Se pasa `openToken` a `ReceivedMessageList`.
4. `ReceivedMessageList` pasa `autoOpen={openToken === msg.token}` a cada `ReceivedMessageCard`.
5. La tarjeta con token coincidente abre su modal automáticamente al montarse.

**El auto-open no depende del `message_id` en la URL** — depende del token, que es el mismo identificador que viaja en todo el flujo.

**Condición para que funcione:** la query del dashboard debe devolver el mensaje con el token correcto. La query filtra por `status = 'delivered'` y `recipients.email = user.email`. Si alguna de esas condiciones no se cumple (email incorrecto, mensaje no está en `delivered`), la lista no incluirá el mensaje y el auto-open no se disparará.

---

## 8. Flujos especiales

### Usuario nuevo (primer acceso)

1. Llega a `recibir/{token}` → no está autenticado → ve página de bienvenida.
2. Hace clic en "Crear cuenta" → `login?next=/{locale}/recibir/{token}`.
3. Usa el modo magic link (`LoginForm`): ingresa email, recibe link de verificación.
4. Hace clic en el link de verificación → `/auth/callback?redirect_to={next}`.
5. `auth/callback` intercambia el code, redirige a `next` = `recibir/{token}`.
6. `recibir/{token}` detecta usuario autenticado con email correcto → `dashboard/received?open={token}`.
7. Dashboard layout detecta `auth_password_set = false` → `set-password?next=...received?open={token}`.
8. Usuario establece contraseña → llega a `dashboard/received?open={token}` → modal abierto.

### Usuario existente

1. Llega a `recibir/{token}` → no está autenticado → ve página de bienvenida.
2. Hace clic en "Ya tengo cuenta" → `login?next=/{locale}/recibir/{token}`.
3. Ingresa email + contraseña → login exitoso → `router.push(next)`.
4. `recibir/{token}` → email coincide → `dashboard/received?open={token}` → modal abierto.

### Usuario no logueado que llega directamente al dashboard

Si el usuario guarda `dashboard/received?open={token}` como bookmark y accede sin sesión, el dashboard layout lo redirige a `login` sin preservar `?open`. El auto-open no se disparará. El usuario puede abrir el mensaje manualmente desde la lista.

### Usuario logueado con email incorrecto

`recibir/{token}` ve que el email autenticado no coincide con `recipients.email` → muestra página de bienvenida sin mensaje de error específico. El usuario puede cerrar sesión e ingresar con el email correcto, o usar el link de login para autenticarse con otra cuenta.

### Link expirado

`recibir/{token}` detecta `expires_at < now` → `redirect(/{locale}/auth/login?error=expired_token)`. La página de login puede mostrar un mensaje de error según ese query param.

### Link inválido (token no existe en DB)

`recibir/{token}` no encuentra el token → `redirect(/{locale}/auth/login?error=invalid_token)`.

---

## 9. Qué NO tocar sin revisar todo el flujo

Los siguientes puntos son críticos. Un cambio en cualquiera puede romper el flujo end-to-end silenciosamente (sin error de compilación):

| Qué | Por qué es crítico |
|-----|-------------------|
| URL generada en el email (`/{locale}/recibir/{token}`) | Si cambia el path, los links ya enviados dejan de funcionar |
| Query de `recibir/[token]` que hace join a `recipients(email)` | Si se remueve el join o se cambia a `delivery_tokens.recipient_email`, vuelve el bug histórico de PR #398 |
| Validación contra `recipients.email` | Fuente de verdad; no reemplazar por ningún otro campo |
| `encodeURIComponent` en el parámetro `?next=` | Sin encode, las query strings del destino se rompen |
| Preservación de `?next` en `LoginForm` → cookie `pending_intent` | Si se elimina, usuarios que pasen por set-password pierden su destino |
| Lectura de `next` en `SetPasswordForm` (prop → cookie → fallback) | El orden importa; no invertir ni eliminar el fallback a cookie |
| Header `x-pathname` + `x-search` en middleware | El dashboard layout los usa para construir `originalUrl`; si el middleware deja de inyectarlos, set-password no puede preservar `?open={token}` |
| Auto-open por `?open={token}` en `ReceivedMessageList` | Si se cambia el parámetro URL o la comparación `openToken === msg.token`, el auto-open deja de funcionar |
| `delivery_tokens!left(token)` en la query del dashboard | Sin esta join, `msg.token` es null y el auto-open nunca coincide |

---

## 10. Checklist manual end-to-end

Usar este checklist para validar el flujo completo después de cualquier cambio en las rutas o componentes involucrados.

### Preparación

- [ ] Limpiar filas de prueba previas en `delivery_tokens`, `recipients`, `messages` si aplica
- [ ] Asegurarse de tener acceso a la bandeja del email de destino
- [ ] Verificar que el email de destino no tiene cuenta existente en Supabase (para probar usuario nuevo)

### Caso 1: Usuario nuevo

- [ ] Crear un mensaje en el wizard con `deliver_on_date` = hoy (o usar el script de prueba si está disponible)
- [ ] Esperar el trigger del cron (o forzarlo manualmente en dev) y confirmar que llega el email
- [ ] Abrir el botón "Ver mi mensaje" del email → debe llegar a `/{locale}/recibir/{token}`
- [ ] Verificar que la página muestra la pantalla de bienvenida con los dos botones
- [ ] Usar "Crear cuenta", ingresar email y enviar magic link
- [ ] Abrir el link del magic link → debe pasar por `/auth/callback` y llegar de vuelta a `recibir/{token}`
- [ ] Si es usuario nuevo: debe aparecer `set-password`
- [ ] Establecer contraseña → debe llegar a `dashboard/received?open={token}` con el modal abierto

### Caso 2: Usuario existente

- [ ] Repetir con una cuenta ya creada
- [ ] Usar "Ya tengo cuenta" e ingresar credenciales
- [ ] Confirmar que después del login llega directamente a `dashboard/received` con el modal abierto

### Caso 3: Link alternativo en el email

- [ ] En el email, buscar el link alternativo visible debajo del botón principal
- [ ] Confirmar que apunta a la misma URL `/{locale}/recibir/{token}`
- [ ] Abrirlo manualmente (copiar y pegar) → debe comportarse igual que el botón

### Validación del contenido del mensaje

- [ ] Probar mensaje de tipo `text`: el modal debe mostrar el contenido de texto
- [ ] Probar mensaje de tipo `audio`: el player de audio debe funcionar
- [ ] Probar mensaje de tipo `video` (requiere plan Pro): el video debe cargarse
- [ ] Probar mensaje "cuando ya no esté" (trusted contacts flow): confirmar que el mensaje se entrega correctamente al destinatario correcto

### Validaciones de integridad

- [ ] Intentar abrir el link con un token inválido → debe redirigir a login con `error=invalid_token`
- [ ] Intentar abrir un token expirado → debe redirigir a login con `error=expired_token`
- [ ] Intentar abrir el link logueado con el email **incorrecto** → debe ver la página de bienvenida, no el mensaje
- [ ] Confirmar en el wizard que no se puede agregar como contacto de confianza el mismo email que el destinatario (validar que el sistema lo rechaza o maneja correctamente — comportamiento a verificar según estado actual de la validación)

---

## 11. Historial de PRs relevantes

| PR | Descripción |
|----|-------------|
| **#398** | Fix real del flujo recibido. Reemplazó la validación contra `delivery_tokens.recipient_email` por join con `recipients` y uso de `recipients.email` como fuente de verdad. Sin este fix, mensajes programados por cron podían fallar la validación de identidad. |
| **#399** | Limpieza de logs temporales de debugging introducidos durante el diagnóstico de PR #398. No cambia comportamiento. |
| **#402** | Agrega link alternativo visible en el email de entrega, debajo del botón CTA. Misma URL que el botón; útil cuando el email client bloquea botones. |
| **#403** | Rediseño visual de las tarjetas en `dashboard/received`: bordes de color según estado de disponibilidad (disponible / solo descarga / expirado), badges de estado. |
| **#404** | Rediseño del header del modal de mensaje recibido: avatar serif, nombre del remitente prominente, fecha reposicionada. Eliminación del `h3` redundante del título en el cuerpo. |
| **#406** | Wizard usa `result.code === 'INVALID_SCHEDULE'` en lugar de comparar texto traducido para decidir el mensaje de error al crear un mensaje con fecha inválida. |

---

*Este documento describe el comportamiento verificado en producción a 2026-04-26. Actualizar si cambian las rutas, la lógica de validación de email, o el mecanismo de auto-open.*
