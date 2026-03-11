-- Migration: Apply Security Advisor Fixes

-- 1. Revoke public access to admin_user_stats view
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'admin_user_stats' AND schemaname = 'public') THEN
    EXECUTE 'REVOKE SELECT ON public.admin_user_stats FROM anon, authenticated';
  END IF;
END $$;

-- 2. Convert views to security_invoker = true
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'my_role' AND schemaname = 'public') THEN
    EXECUTE 'ALTER VIEW public.my_role SET (security_invoker = true)';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'admin_user_stats' AND schemaname = 'public') THEN
    EXECUTE 'ALTER VIEW public.admin_user_stats SET (security_invoker = true)';
  END IF;
END $$;

-- 3. Fix search_path = '' on all mutable functions
DO $$ 
BEGIN
  -- admin_total_storage_mb (requires 2 timestamptz args)
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE p.proname = 'admin_total_storage_mb' AND n.nspname = 'public') THEN
    EXECUTE 'ALTER FUNCTION public.admin_total_storage_mb(timestamptz, timestamptz) SET search_path = ''''';
  END IF;

  -- admin_total_paid_users
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE p.proname = 'admin_total_paid_users' AND n.nspname = 'public') THEN
    EXECUTE 'ALTER FUNCTION public.admin_total_paid_users(timestamptz, timestamptz) SET search_path = ''''';
  END IF;

  -- get_user_email
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE p.proname = 'get_user_email' AND n.nspname = 'public') THEN
    EXECUTE 'ALTER FUNCTION public.get_user_email(uuid) SET search_path = ''''';
  END IF;

  -- check_if_admin (no args overload)
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE p.proname = 'check_if_admin' AND n.nspname = 'public' AND pg_get_function_identity_arguments(p.oid) = '') THEN
    EXECUTE 'ALTER FUNCTION public.check_if_admin() SET search_path = ''''';
  END IF;

  -- check_if_admin (uuid overload)
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE p.proname = 'check_if_admin' AND n.nspname = 'public' AND pg_get_function_identity_arguments(p.oid) = 'p_user_id uuid') THEN
    EXECUTE 'ALTER FUNCTION public.check_if_admin(uuid) SET search_path = ''''';
  END IF;

  -- admin_total_users
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE p.proname = 'admin_total_users' AND n.nspname = 'public') THEN
    EXECUTE 'ALTER FUNCTION public.admin_total_users(timestamptz, timestamptz) SET search_path = ''''';
  END IF;

  -- debug_my_access
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE p.proname = 'debug_my_access' AND n.nspname = 'public') THEN
    EXECUTE 'ALTER FUNCTION public.debug_my_access() SET search_path = ''''';
  END IF;

  -- handle_new_user
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE p.proname = 'handle_new_user' AND n.nspname = 'public') THEN
    EXECUTE 'ALTER FUNCTION public.handle_new_user() SET search_path = ''''';
  END IF;
END $$;

-- 4. Replace insecure RLS on public.email_events
DROP POLICY IF EXISTS "Service role can insert email events" ON public.email_events;

CREATE POLICY "Users can insert their own email events"
  ON public.email_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 5. delivery_tokens & stripe_webhook_events
-- Verified: Only accessed securely backend-side via Service Role. 
-- NO client queries exist. It is completely safe to leave them without policies 
-- (which is the default deny-all behavior for RLS to public clients).
