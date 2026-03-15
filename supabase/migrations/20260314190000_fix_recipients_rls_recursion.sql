-- 1. Crear función helper que evita el ciclo
CREATE OR REPLACE FUNCTION public.is_message_owner(p_message_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.messages
    WHERE id = p_message_id
    AND owner_id = auth.uid()
  );
$$;

-- 2. Recrear la policy de recipients usando la función en vez de subquery directa
DROP POLICY IF EXISTS "Users can view recipients of their messages" ON public.recipients;
DROP POLICY IF EXISTS "Users can view recipients of own messages" ON public.recipients;
DROP POLICY IF EXISTS "Users can insert recipients to own messages" ON public.recipients;
DROP POLICY IF EXISTS "Users can update recipients of own messages" ON public.recipients;
DROP POLICY IF EXISTS "Users can delete recipients of own messages" ON public.recipients;

CREATE POLICY "Users can view recipients of their messages" ON public.recipients
  FOR SELECT TO authenticated
  USING (
    email = auth.jwt() ->> 'email'
    OR public.is_message_owner(message_id)
  );

CREATE POLICY "Users can insert recipients to own messages" ON public.recipients
  FOR INSERT TO authenticated
  WITH CHECK (public.is_message_owner(message_id));

CREATE POLICY "Users can update recipients of own messages" ON public.recipients
  FOR UPDATE TO authenticated
  USING (public.is_message_owner(message_id));

CREATE POLICY "Users can delete recipients of own messages" ON public.recipients
  FOR DELETE TO authenticated
  USING (public.is_message_owner(message_id));
