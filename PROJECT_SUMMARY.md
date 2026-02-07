# VoiceForLater - Resumen Completo del Proyecto

> **Última actualización**: 4 de febrero, 2026  
> **Generado por**: Antigravity AI

---

## 📋 Índice

1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Arquitectura y Stack Tecnológico](#arquitectura-y-stack-tecnológico)
3. [Esquema de Base de Datos](#esquema-de-base-de-datos)
4. [Funcionalidades Principales](#funcionalidades-principales)
5. [Estructura del Proyecto](#estructura-del-proyecto)
6. [Componentes Clave](#componentes-clave)
7. [API Routes](#api-routes)
8. [Internacionalización](#internacionalización)
9. [Integraciones Externas](#integraciones-externas)
10. [Cambios Recientes](#cambios-recientes)

---

## Descripción del Proyecto

**VoiceForLater** es una aplicación web que permite a los usuarios crear y programar mensajes (texto, audio o video) para ser enviados a personas específicas en fechas futuras o bajo condiciones definidas (como cuando el usuario deja de confirmar su actividad).

### 🎯 Propósito

- **Legado Emocional**: Dejar mensajes para momentos importantes en el futuro
- **Entrega Programada**: Enviar mensajes en fechas específicas (cumpleaños, aniversarios, etc.)
- **Sistema de Check-in**: Entrega automática si el usuario deja de confirmar su actividad
- **Control Total**: Los usuarios pueden editar o eliminar mensajes mientras estén activos

### 💡 Casos de Uso

- Mensajes para hijos cuando sean mayores
- Palabras para fechas importantes
- Mensajes de apoyo para momentos específicos
- Mensajes que solo deberían enviarse si el usuario no responde más
- Auto-recordatorios para el futuro

---

## Arquitectura y Stack Tecnológico

### Frontend

| Tecnología | Versión | Uso |
|:-----------|:--------|:----|
| **Next.js** | 16.1.5 | Framework principal (App Router) |
| **React** | 19.2.3 | UI library |
| **TypeScript** | ^5 | Tipado estático |
| **Tailwind CSS** | ^3.4.19 | Estilos y diseño |

### Backend & Servicios

| Servicio | Propósito |
|:---------|:----------|
| **Supabase** | Base de datos PostgreSQL + Autenticación (Magic Links) |
| **Stripe** | Pagos y suscripciones (Plan Pro: $10/año) |
| **Resend** | Envío de emails transaccionales |
| **Vercel** | Hosting y deployment |

### Dependencias Principales

```json
{
  "@supabase/ssr": "^0.8.0",
  "@supabase/supabase-js": "^2.93.3",
  "stripe": "^20.3.0",
  "resend": "^6.8.0",
  "uuid": "^13.0.0"
}
```

---

## Esquema de Base de Datos

### Tablas Principales

#### 1. **profiles**
Extiende `auth.users` de Supabase con información del plan y Stripe.

```sql
- id: UUID (PK, FK → auth.users)
- plan: TEXT (free | pro)
- stripe_customer_id: TEXT
- stripe_subscription_id: TEXT
- created_at: TIMESTAMPTZ
```

#### 2. **messages**
Almacena todos los mensajes creados por usuarios.

```sql
- id: UUID (PK)
- owner_id: UUID (FK → profiles)
- type: TEXT (text | audio)
- status: TEXT (draft | scheduled | delivered)
- text_content: TEXT
- audio_path: TEXT
- created_at: TIMESTAMPTZ
```

#### 3. **recipients**
Destinatarios de cada mensaje.

```sql
- id: UUID (PK)
- message_id: UUID (FK → messages)
- name: TEXT
- email: TEXT
```

#### 4. **delivery_rules**
Reglas de entrega para cada mensaje.

```sql
- id: UUID (PK)
- message_id: UUID (FK → messages, UNIQUE)
- mode: TEXT (date | checkin)
- deliver_at: TIMESTAMPTZ
- checkin_interval_days: INT (30 | 60 | 90)
- attempts_limit: INT (default: 3)
```

#### 5. **trusted_contacts**
Persona de confianza que será contactada si el usuario deja de confirmar.

```sql
- id: UUID (PK)
- user_id: UUID (FK → profiles, UNIQUE)
- name: TEXT
- email: TEXT
```

#### 6. **checkins**
Estado de confirmación de actividad del usuario.

```sql
- id: UUID (PK)
- user_id: UUID (FK → profiles, UNIQUE)
- last_confirmed_at: TIMESTAMPTZ
- next_due_at: TIMESTAMPTZ
- attempts: INT
- status: TEXT (active | pending | confirmed_absent)
```

#### 7. **delivery_tokens**
Tokens seguros para que los destinatarios accedan a sus mensajes.

```sql
- id: UUID (PK)
- message_id: UUID (FK → messages)
- recipient_id: UUID (FK → recipients)
- token: TEXT (UNIQUE)
- expires_at: TIMESTAMPTZ
- used_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
```

#### 8. **events**
Logging de eventos del sistema.

```sql
- id: UUID (PK)
- type: TEXT
- user_id: UUID (FK → profiles)
- metadata: JSONB
- created_at: TIMESTAMPTZ
```

### Migraciones

1. [`001_initial_schema.sql`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/supabase/migrations/001_initial_schema.sql) - Schema inicial completo
2. [`002_audio_bucket.sql`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/supabase/migrations/002_audio_bucket.sql) - Bucket de storage para archivos de audio
3. [`003_stripe_fields.sql`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/supabase/migrations/003_stripe_fields.sql) - Campos adicionales para Stripe

---

## Funcionalidades Principales

### 🔐 Autenticación

- **Magic Link Authentication** vía Supabase
- Sin contraseñas - solo email
- Auto-creación de perfil en signup

### 📝 Creación de Mensajes (Wizard de 5 Pasos)

**Step 1: Tipo de Mensaje**
- Texto (Free + Pro)
- Audio (Pro)
- Video (Pro) - con upgrade prompt

**Step 2: Contenido**
- Editor de texto con límite de caracteres
- Grabador de audio con preview
- Grabador de video

**Step 3: Destinatarios**
- Nombre y email del destinatario
- Múltiples destinatarios posibles

**Step 4: Reglas de Entrega**
- **Fecha específica**: Cumpleaños, aniversarios, etc.
- **Check-in mode**: Si el usuario deja de confirmar actividad
  - Intervalos: 7 días (Free), 30/60/90 días (Pro)
  - 3 intentos antes de contactar persona de confianza
- **Modo prueba**: Entrega en 5 minutos (testing)

**Step 5: Revisión**
- Preview completo del mensaje
- Confirmación final antes de guardar

### 📊 Dashboard

- Lista de todos los mensajes del usuario
- Estados: Draft, Scheduled, Delivered
- Acciones: Ver, Editar, Eliminar
- Límite de 1 mensaje en plan Free
- Modal de upgrade cuando se alcanza el límite

### ✅ Sistema de Check-in

- Recordatorios periódicos para confirmar actividad
- Dashboard muestra próxima fecha de confirmación
- Si no confirma 3 veces → contacta persona de confianza
- Luego procede con entrega de mensajes

### 👥 Contacto de Confianza (Pro)

- Una persona que será contactada si el usuario falta
- Confirmación de email para prevenir errores
- Solo disponible en plan Pro

### 💳 Planes y Pagos

**Plan Free**
- 1 mensaje
- Solo texto

**Plan Pro ($10/año)**
- Mensajes ilimitados
- Texto + Audio + Video
- Control total de entrega
- Contacto de confianza
- Intervalos de check-in personalizados

---

## Estructura del Proyecto

```
voiceforlater/
├── app/
│   ├── [locale]/              # Rutas con i18n
│   │   ├── auth/
│   │   │   └── login/
│   │   ├── dashboard/
│   │   │   └── page.tsx       # Dashboard principal
│   │   ├── messages/
│   │   │   ├── new/           # Wizard de creación
│   │   │   └── [id]/          # Ver mensaje individual
│   │   ├── layout.tsx         # Layout con i18n
│   │   └── page.tsx           # Landing page
│   ├── api/
│   │   ├── auth/
│   │   │   └── magic-link/    # Envío de magic links
│   │   ├── checkin/
│   │   │   └── confirm/       # Confirmar actividad
│   │   ├── cron/
│   │   │   ├── process-checkins/   # Procesar check-ins vencidos
│   │   │   └── process-messages/   # Enviar mensajes programados
│   │   ├── messages/          # CRUD de mensajes
│   │   ├── stripe/
│   │   │   ├── checkout/      # Crear sesión de pago
│   │   │   ├── portal/        # Portal de gestión
│   │   │   └── webhook/       # Webhooks de Stripe
│   │   └── trusted-contact/   # CRUD contacto de confianza
│   ├── globals.css
│   └── page.tsx               # Redirect a locale
├── components/
│   ├── auth/
│   │   └── magic-link-form.tsx
│   ├── dashboard/
│   │   ├── checkin-status.tsx
│   │   ├── create-message-button.tsx
│   │   ├── message-actions.tsx
│   │   ├── message-status.tsx
│   │   └── trusted-contact-form.tsx
│   ├── stripe/
│   │   └── upgrade-button.tsx
│   └── wizard/
│       ├── audio-recorder.tsx
│       ├── video-recorder.tsx
│       ├── step-indicator.tsx
│       ├── step1-type.tsx
│       ├── step2-content.tsx
│       ├── step3-recipient.tsx
│       ├── step4-delivery.tsx
│       ├── step5-review.tsx
│       ├── wizard-client.tsx
│       └── wizard-context.tsx
├── lib/
│   ├── i18n/                  # Configuración i18n
│   ├── plans/                 # Lógica de planes
│   ├── supabase/
│   │   ├── admin.ts           # Cliente admin
│   │   ├── client.ts          # Cliente browser
│   │   ├── server.ts          # Cliente server
│   │   └── middleware.ts      # Middleware de auth
│   ├── indexed-db.ts          # Storage local para drafts
│   └── resend.ts              # Cliente de Resend
├── messages/
│   ├── es.json                # Traducciones español
│   └── en.json                # Traducciones inglés
├── public/
│   └── assets/                # Imágenes de landing
├── scripts/
│   └── ...                    # Scripts administrativos
├── supabase/
│   └── migrations/            # Migraciones SQL
├── middleware.ts              # Auth + i18n middleware
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Componentes Clave

### Auth
- [`magic-link-form.tsx`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/components/auth/magic-link-form.tsx) - Formulario de login con magic link

### Dashboard
- [`checkin-status.tsx`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/components/dashboard/checkin-status.tsx) - Muestra estado de check-in y botón de confirmación
- [`create-message-button.tsx`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/components/dashboard/create-message-button.tsx) - Botón que verifica límites antes de crear
- [`message-actions.tsx`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/components/dashboard/message-actions.tsx) - Acciones de mensaje (ver, editar, eliminar)
- [`message-status.tsx`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/components/dashboard/message-status.tsx) - Badge de estado del mensaje
- [`trusted-contact-form.tsx`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/components/dashboard/trusted-contact-form.tsx) - Formulario para agregar/editar contacto de confianza

### Wizard
- [`wizard-context.tsx`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/components/wizard/wizard-context.tsx) - React Context para estado del wizard
- [`wizard-client.tsx`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/components/wizard/wizard-client.tsx) - Componente principal del wizard
- [`step-indicator.tsx`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/components/wizard/step-indicator.tsx) - Indicador visual de pasos
- [`step1-type.tsx`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/components/wizard/step1-type.tsx) - Selección de tipo de mensaje
- [`step2-content.tsx`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/components/wizard/step2-content.tsx) - Editor de contenido
- [`step3-recipient.tsx`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/components/wizard/step3-recipient.tsx) - Formulario de destinatario
- [`step4-delivery.tsx`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/components/wizard/step4-delivery.tsx) - Configuración de entrega
- [`step5-review.tsx`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/components/wizard/step5-review.tsx) - Revisión final
- [`audio-recorder.tsx`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/components/wizard/audio-recorder.tsx) - Grabadora de audio con preview
- [`video-recorder.tsx`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/components/wizard/video-recorder.tsx) - Grabadora de video

### Stripe
- [`upgrade-button.tsx`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/components/stripe/upgrade-button.tsx) - Botón de upgrade a Pro con integración Stripe

---

## API Routes

### Autenticación
- **POST** `/api/auth/magic-link` - Envía magic link al email del usuario

### Check-in
- **POST** `/api/checkin/confirm` - Confirma actividad del usuario

### Mensajes
- **GET/POST** `/api/messages` - Lista o crea mensajes
- **GET/PUT/DELETE** `/api/messages/[id]` - CRUD individual

### Stripe
- **POST** `/api/stripe/checkout` - Crea sesión de checkout para upgrade
- **POST** `/api/stripe/portal` - Crea sesión del portal de cliente
- **POST** `/api/stripe/webhook` - Procesa webhooks de Stripe (eventos de pago)

### Contacto de Confianza
- **GET/POST/PUT/DELETE** `/api/trusted-contact` - CRUD de contacto de confianza

### Cron Jobs (Vercel Cron)
- **GET** `/api/cron/process-checkins` - Procesa check-ins vencidos y envía recordatorios
- **GET** `/api/cron/process-messages` - Procesa y envía mensajes programados

---

## Internacionalización

### Idiomas Soportados
- 🇪🇸 Español (es) - Default
- 🇬🇧 Inglés (en)

### Archivos de Traducción

**Español**: [`messages/es.json`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/messages/es.json) (309 líneas, 11.5 KB)  
**Inglés**: [`messages/en.json`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/messages/en.json)

### Estructura de Traducciones

```json
{
  "common": { ... },
  "landing": {
    "hero": { ... },
    "emotional": { ... },
    "uses": { ... },
    "howItWorks": { ... },
    "delivery": { ... },
    "audio": { ... },
    "trust": { ... },
    "notWhat": { ... },
    "pricing": { ... },
    "footer": { ... }
  },
  "auth": { ... },
  "dashboard": { ... },
  "wizard": { ... },
  "checkin": { ... },
  "trustedContact": { ... },
  "stripe": { ... }
}
```

### Sistema de Routing

El proyecto usa **Next.js App Router** con rutas dinámicas `[locale]`:
- `/es` → Landing en español
- `/en` → Landing en inglés
- `/es/auth/login` → Login en español
- `/es/dashboard` → Dashboard en español
- etc.

---

## Integraciones Externas

### 🗄️ Supabase

**Servicios utilizados:**
- **Auth**: Magic link authentication
- **Database**: PostgreSQL con Row Level Security (RLS)
- **Storage**: Bucket para archivos de audio (migration 002)

**Configuración:**
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

### 💳 Stripe

**Productos:**
- Plan Pro: $10/año (price_id configurado en env)

**Webhooks escuchados:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Configuración:**
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_ID

### 📧 Resend

**Emails enviados:**
- Magic link para login
- Recordatorios de check-in
- Notificaciones a contacto de confianza
- Entrega de mensajes a destinatarios

**Configuración:**
- RESEND_API_KEY

### ☁️ Vercel

**Features utilizadas:**
- Hosting y deployment
- Vercel Cron para jobs programados
- Environment variables

**Cron jobs configurados:**
- `process-checkins`: Cada hora
- `process-messages`: Cada hora

---

## Cambios Recientes

### Conversación: "Adding Email Confirmation" (2026-02-04)

**Cambios realizados:**
- ✅ Agregado campo de confirmación de email en [`trusted-contact-form.tsx`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/components/dashboard/trusted-contact-form.tsx)
- ✅ Validación para asegurar que ambos emails coinciden
- ✅ Mensaje de error si los emails no coinciden
- ✅ Botón de guardar deshabilitado hasta que coincidan
- ✅ Traducciones agregadas en `es.json` y `en.json`:
  - `confirmEmailLabel`
  - `confirmEmailPlaceholder`
  - `emailMismatch`

### Conversación: "Integrate Product Copy" (2026-02-03)

**Cambios realizados:**
- ✅ Actualizado [`messages/es.json`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/messages/es.json) con copy específico para:
  - Landing page hero
  - Sección de usos
  - Sección "Lo que VoiceForLater no es"
  - Dashboard
  - Wizard
- ✅ Modificada la sección de usos en [`page.tsx`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/app/[locale]/page.tsx) para mostrar lista simple
- ✅ Agregada nueva sección "notWhat" en landing page

### Conversación: "Project Audit and Fixes" (2026-02-02)

**Actividades realizadas:**
- ✅ Auditoría completa del proyecto
- ✅ Verificación de flujos de autenticación
- ✅ Verificación de integración Stripe
- ✅ Verificación de pricing y copy crítico
- ✅ Verificación de wizard end-to-end
- ✅ Verificación de dashboard
- ✅ Verificación de internacionalización
- ✅ Reporte de bugs y correcciones aplicadas

### Conversación: "Debugging Email Delivery" (2026-02-01)

**Problemas resueltos:**
- ✅ Debugging de entrega de emails
- ✅ Verificación de configuración Resend
- ✅ Validación de logs de entrega

### Conversación: "Refining Step 1 UI" (2026-01-31)

**Cambios realizados:**
- ✅ Estilo oscuro y con sombras para botones de tipo de mensaje en [`step1-type.tsx`](file:///c:/Users/danie/Documents/Proyecto/Antigravity/voiceforlater/components/wizard/step1-type.tsx)
- ✅ CTA explícito "Upgrade to Pro" en opción de video para usuarios free
- ✅ Mejora visual de la UI del paso 1

### Conversación: "Refining Hero Banner" (2026-01-31)

**Cambios realizados:**
- ✅ Transformación del hero section en banner text-dominant
- ✅ Integración de 2-3 imágenes pequeñas y detalladas
- ✅ Diseño calm, intimate, y layered
- ✅ Grid de imágenes estilo filmstrip/gallery

### Conversación: "Refining Landing Page" (2026-01-27)

**Cambios realizados:**
- ✅ Ajustes tipográficos en landing page
- ✅ Eliminación de subtítulos duplicados
- ✅ Modificación de sección de closing con quote prominente
- ✅ Actualización de fuente del hero title
- ✅ Consistencia de tono con valores del producto

---

## 📊 Métricas del Proyecto

### Archivos

- **Total de archivos TypeScript/TSX**: ~50+
- **Componentes React**: 17
- **API Routes**: 9
- **Migraciones SQL**: 3
- **Archivos de traducción**: 2

### Código

- **messages/es.json**: 309 líneas, 11.5 KB
- **Landing page**: 357 líneas
- **Initial schema**: 277 líneas SQL

### Assets

- **Imágenes en `/public/assets`**: 5+
  - hero-calm-morning.png
  - atmosphere-home.png
  - uses-writing.png
  - detail-tea.png
  - detail-book.png
  - media-recording.png

---

## 🚀 Deployment

**Plataforma**: Vercel  
**URL de producción**: (configurada en Vercel)

**Variables de entorno requeridas:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
RESEND_API_KEY=
```

**Build comando**: `npm run build`  
**Start comando**: `npm run start`  
**Dev comando**: `npm run dev`

---

## 🎨 Diseño y UX

### Paleta de Colores (Tailwind Config)

El proyecto usa un sistema de diseño basado en variables CSS con tema claro/oscuro:

- **Primary**: Color principal de marca
- **Secondary**: Color secundario
- **Foreground**: Texto principal
- **Muted**: Texto secundario
- **Border**: Bordes y divisores
- **Card**: Fondo de tarjetas

### Fuentes

- **Font Principal**: Configurada vía `next/font`
- **Hero Title**: `var(--font-barlow)` - Fuente ligera para impacto

### Principios de Diseño

1. **Calm & Intimate**: Diseño tranquilo y personal
2. **Text-Dominant**: Contenido sobre decoración
3. **Emotional Anchoring**: Conexión emocional con el usuario
4. **Clean & Modern**: Interfaz limpia y moderna
5. **Responsive**: Mobile-first design

---

## 🔒 Seguridad

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con políticas que aseguran:
- Los usuarios solo pueden ver/editar sus propios datos
- Los mensajes solo son accesibles por sus owners
- Los destinatarios solo pueden acceder vía delivery tokens

### Autenticación

- Magic link sin contraseñas
- Tokens de sesión seguros vía Supabase
- CSRF protection

### Data Privacy

- Emails encriptados en tránsito
- Audio storage con permisos restrictivos
- Delivery tokens con expiración

---

## 📝 Próximos Pasos Potenciales

> **Nota**: Estos son posibles desarrollos futuros, no funcionalidades actuales.

- [ ] Soporte para video completo
- [ ] Multiple trusted contacts
- [ ] Recordatorios personalizados
- [ ] Mensajes grupales
- [ ] Analytics para usuarios
- [ ] Exportación de datos
- [ ] Templates de mensajes
- [ ] Integración con calendario

---

## 🤝 Contribuciones y Mantenimiento

Este proyecto ha sido desarrollado con asistencia de **Antigravity AI** a través de múltiples conversaciones, abordando:

- Arquitectura inicial y setup
- Implementación de features core
- Refinamiento de UI/UX
- Integración de servicios externos
- Internacionalización
- Auditoría y debugging
- Optimizaciones y mejoras continuas

---

**Documento generado el**: 4 de febrero, 2026  
**Versión del proyecto**: 0.1.0

