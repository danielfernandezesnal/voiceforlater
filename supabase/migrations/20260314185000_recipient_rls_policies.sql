-- Policy 1: Destinatarios pueden leer mensajes que les fueron entregados
DROP POLICY IF EXISTS "Recipients can view their delivered messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view received messages" ON public.messages;
CREATE POLICY "Recipients can view their delivered messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  status = 'delivered'
  AND EXISTS (
    SELECT 1 FROM public.recipients
    WHERE recipients.message_id = messages.id
    AND recipients.email = auth.jwt() ->> 'email'
  )
);

-- Policy 2: Usuarios pueden leer recipients de mensajes que recibieron o enviaron
DROP POLICY IF EXISTS "Users can view recipients of their messages" ON public.recipients;
DROP POLICY IF EXISTS "Users can view their own recipient entries" ON public.recipients;
CREATE POLICY "Users can view recipients of their messages"
ON public.recipients
FOR SELECT
TO authenticated
USING (
  email = auth.jwt() ->> 'email'
  OR EXISTS (
    SELECT 1 FROM public.messages
    WHERE messages.id = recipients.message_id
    AND messages.owner_id = auth.uid()
  )
);

-- Policy 3: Destinatarios pueden leer delivery_tokens de sus mensajes entregados
DROP POLICY IF EXISTS "Recipients can view delivery tokens of their messages" ON public.delivery_tokens;
DROP POLICY IF EXISTS "Users can view their own delivery tokens" ON public.delivery_tokens;
CREATE POLICY "Recipients can view delivery tokens of their messages"
ON public.delivery_tokens
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.recipients r ON r.message_id = m.id
    WHERE m.id = delivery_tokens.message_id
    AND m.status = 'delivered'
    AND r.email = auth.jwt() ->> 'email'
  )
);

-- Policy 4: Destinatarios pueden leer el perfil del remitente (para mostrar el nombre)
DROP POLICY IF EXISTS "Users can view sender profiles of received messages" ON public.profiles;
CREATE POLICY "Users can view sender profiles of received messages"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.recipients r ON r.message_id = m.id
    WHERE m.owner_id = profiles.id
    AND m.status = 'delivered'
    AND r.email = auth.jwt() ->> 'email'
  )
);
