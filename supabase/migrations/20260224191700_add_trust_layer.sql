-- ━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TRUST LAYER v1
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Alter public.profiles to track ToS acceptance
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tos_version TEXT,
  ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ;

-- 2. Create public.contact_tickets table for manual handling First
CREATE TABLE IF NOT EXISTS public.contact_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'spam')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.contact_tickets ENABLE ROW LEVEL SECURITY;

-- Explicitly revoke broad access from anon and authenticated
REVOKE ALL ON TABLE public.contact_tickets FROM PUBLIC, anon, authenticated;

-- Grant standard permissions (api inserts via service_role, explicit RLS for authenticated if needed)
-- For Contact tickets, we will insert them via a secure server action or route using Service Role,
-- so we don't need anon/authenticated INSERT grants directly on the table to bypass RLS.
-- But we can grant SELECT and UPDATE to authenticated admins via RLS.
-- Let's provide basic INSERT to authenticated users if we want them to insert natively,
-- but the requirement is: "* Recommended: deny direct anon/auth inserts; only allow inserts via API (service role)."
-- Consequently, we rely on service role. 
-- Service role always bypasses RLS if configured via admin client.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.contact_tickets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.contact_tickets TO postgres;

-- Allowed via RLS for Admins (read/update pattern reused from A01)
CREATE POLICY "Admins can view tickets"
  ON public.contact_tickets
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update tickets"
  ON public.contact_tickets
  FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- 3. DB Enforcement (Defense-in-Depth for ToS)
-- We enforce this on public.messages BEFORE INSERT
CREATE OR REPLACE FUNCTION public.enforce_tos_before_message()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, extensions
LANGUAGE plpgsql
AS $$
DECLARE
  v_tos_accepted_at TIMESTAMPTZ;
BEGIN
  -- System & Cron processes (service_role) or unauthenticated flows (like webhook) bypass this check
  -- PostgREST API with user JWT sets auth.uid()
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Spoof defense: check if auth.uid() is trying to insert for someone else
  -- (messages also has RLS but trigger runs before RLS row verification or as part of policy sometimes,
  -- adding explicit check here adds layer of spoof defense)
  IF auth.uid() IS NOT NULL AND NEW.owner_id != auth.uid() THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Spoofing owner_id is forbidden.';
  END IF;

  -- Fetch user's ToS acceptance state
  SELECT tos_accepted_at INTO v_tos_accepted_at
  FROM public.profiles
  WHERE id = NEW.owner_id;

  -- Test if accepted
  IF v_tos_accepted_at IS NULL THEN
    RAISE EXCEPTION 'TOS_NOT_ACCEPTED: Acceptance of Terms of Service is strictly required.';
  END IF;

  RETURN NEW;
END;
$$;

-- Revoke execution from anonymous/public
REVOKE EXECUTE ON FUNCTION public.enforce_tos_before_message() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enforce_tos_before_message() TO authenticated, service_role, postgres;

-- Create the trigger
DROP TRIGGER IF EXISTS tr_enforce_tos_before_message ON public.messages;
CREATE TRIGGER tr_enforce_tos_before_message
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.enforce_tos_before_message();
