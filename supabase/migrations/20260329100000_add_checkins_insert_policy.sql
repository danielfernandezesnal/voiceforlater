-- Add missing INSERT RLS policy on checkins.
--
-- The original schema defined SELECT and UPDATE policies but omitted INSERT.
-- This caused the upsert in POST /api/messages to be silently blocked by RLS
-- whenever a user created their first check-in message (no existing row → INSERT path).
-- The upsert error was not captured, so the message and delivery_rule were saved
-- but the checkins row was never created.

CREATE POLICY "Users can insert own checkin"
  ON public.checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);
