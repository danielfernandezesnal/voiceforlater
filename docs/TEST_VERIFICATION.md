
# Cómo probar la Confirmación de Vida (Local)

Para probar el flujo de "Verify Status" sin esperar al Cron Job:

## 1. Prerrequisitos
Asegúrate de que tu base de datos local (o dev) tenga las tablas creadas.
Ejecuta la migración si no se ha aplicado automáticamente (Supabase local):
`supabase migration up` (si usas CLI) o copia el SQL de `supabase/migrations/009_create_verification_tables.sql` en el SQL Editor de Supabase.

## 2. Generar un Token de Prueba (Manual)
Necesitas insertar un token válido en la base de datos.

1.  Abre SQL Editor en Supabase Dashboard.
2.  Ejecuta este script (reemplaza `USER_ID` con un ID real de tu tabla `profiles`):

```sql
-- Reemplaza con un user_id real
DO $$
DECLARE
  target_user_id uuid := 'TU_USER_ID_AQUI'; 
  -- Token Raw: 'test-token-123'
  -- SHA256('test-token-123') = 'f42c2f1760074258700072045e03217036490356597711477742d47053075c74'
  test_hash text := 'f42c2f1760074258700072045e03217036490356597711477742d47053075c74';
BEGIN
  INSERT INTO public.verification_tokens (
    user_id, 
    contact_email, 
    token_hash, 
    expires_at, 
    action
  ) VALUES (
    target_user_id, 
    'trusted@test.com', 
    test_hash, 
    now() + interval '1 day', 
    'verify-status'
  );
END $$;
```

## 3. Probar la UI
1.  Levanta el servidor: `npm run dev`
2.  Navega a: `http://localhost:3000/en/verify-status?token=test-token-123`
3.  Deberías ver la pantalla de confirmación.
4.  Haz clic en "Yes, Confirm" o "No, False Alarm".

## 4. Probar con cURL (API Directa)

**Confirmar (Release Messages):**
```bash
curl -X POST http://localhost:3000/api/verify-status \
  -H "Content-Type: application/json" \
  -d '{"token": "test-token-123", "decision": "confirm"}'
```

**Denegar (False Alarm):**
(Genera otro token primero o limpia el campo `used_at` en DB)
```bash
curl -X POST http://localhost:3000/api/verify-status \
  -H "Content-Type: application/json" \
  -d '{"token": "test-token-123", "decision": "deny"}'
```

## 5. Verificar Resultados
- Revisa la tabla `verification_tokens`: `used_at` debe tener valores.
- Revisa la tabla `confirmation_events`: debe haber un registro nuevo.
- Revisa `messages`: si confirmaste, el estado debería haber cambiado (si había mensajes elegibles y Resend configurado).
