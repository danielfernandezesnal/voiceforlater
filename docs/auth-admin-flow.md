# Flujo de Autenticación y Redirección Admin

Este documento describe la lógica de autenticación y protección de rutas para usuarios normales y administradores.

## 1. Flujo Usuario Normal
1. **Login**: El usuario ingresa su email en `/login`.
2. **Magic Link**: Recibe un correo y hace clic.
3. **Callback**: `app/[locale]/auth/callback/route.ts` verifica el token.
4. **Redirección**: Al no ser admin, se le redirige a `/[locale]/dashboard`.

## 2. Flujo Administrador
1. **Login**: El admin ingresa su email (definido en constantes) en `/login`.
2. **Magic Link**: Recibe el correo (enviado a la cuenta real del owner si está configurado en el backend).
3. **Callback**: `auth/callback` verifica el token Y detecta que el email coincide con `ADMIN_EMAIL`.
4. **Redirección**: Se fuerza la redirección inmediata a `/[locale]/admin`.

## 3. Middleware (Safety Net)
El archivo `middleware.ts` actúa como una capa de seguridad global que se ejecuta antes de renderizar cualquier página:
* **Protección de Admin**: Si un usuario NO admin intenta entrar a `/admin`, lo redirige a `/dashboard`.
* **Encapsulamiento de Admin**: Si el Admin intenta entrar a `/dashboard`, lo redirige a `/admin`.

Esto asegura que el admin nunca vea la interfaz de usuario normal y viceversa, incluso si navegan manualmente escribiendo la URL.

## 4. Configuración
La dirección de email del administrador está centralizada en un único archivo para evitar inconsistencias.

* **Archivo**: `lib/constants.ts`
* **Constante**: `export const ADMIN_EMAIL = "admin@carrymywords.com";`

Cualquier cambio de email de administrador debe hacerse editando únicamente esta constante.

## 5. Testing Rápido
Para validar el sistema:

1. **Prueba Usuario Normal**: 
   - Loguearse con cualquier email (ej: `test@example.com`).
   - Verificar que aterriza en `/dashboard`.
   - Intentar entrar manualmente a `/admin` -> debe rebotar al dashboard.

2. **Prueba Admin**: 
   - Loguearse con `admin@carrymywords.com`.
   - Verificar que aterriza en `/admin`.

3. **Prueba Rebote Admin**: 
   - Estando logueado como admin, intentar ir manualmente a `/dashboard`.
   - Debe rebotar automáticamente a `/admin`.
