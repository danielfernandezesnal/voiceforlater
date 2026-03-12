-- Allow recipients to view their own entries
CREATE POLICY "Users can view their own recipient entries"
ON public.recipients FOR SELECT
USING (email = auth.jwt()->>'email');

-- Allow recipients to view messages sent to them (only if delivered)
CREATE POLICY "Users can view received messages"
ON public.messages FOR SELECT
USING (
  status = 'delivered' AND
  EXISTS (
    SELECT 1 FROM public.recipients
    WHERE recipients.message_id = messages.id
    AND recipients.email = auth.jwt()->>'email'
  )
);

-- Allow recipients to view their own delivery tokens
CREATE POLICY "Users can view their own delivery tokens"
ON public.delivery_tokens FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.recipients
    WHERE recipients.id = delivery_tokens.recipient_id
    AND recipients.email = auth.jwt()->>'email'
  )
);
