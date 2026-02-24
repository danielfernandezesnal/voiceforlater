-- 025_revoke_anon_execute_admin_rpcs.sql
-- OWASP A01 Fix: Revoke PUBLIC/anon EXECUTE on sensitive admin functions
-- 
-- Context:
--   information_schema.routine_privileges shows anon and PUBLIC have EXECUTE
--   on admin_kpis, admin_list_users, admin_total_users, admin_total_paid_users,
--   admin_total_storage_mb, and get_user_email. These are SECURITY DEFINER
--   functions that access auth.users and other privileged tables.
--   While the functions have internal check_if_admin() guards, defense-in-depth
--   requires revoking execution at the GRANT level so anonymous callers
--   cannot even invoke the function.
--
-- Strategy:
--   1. REVOKE ALL FROM PUBLIC (covers anon, which inherits from PUBLIC)
--   2. GRANT EXECUTE only to authenticated (and service_role where needed)
--   3. get_user_email is hardened to service_role only (no authenticated access)
--   4. Covers all known overloads of admin_list_users
--
-- Safety: This migration only changes GRANT/REVOKE. No function logic is altered.

-- ============================================
-- 1. admin_kpis(TIMESTAMPTZ, TIMESTAMPTZ)
-- ============================================
REVOKE ALL ON FUNCTION public.admin_kpis(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_kpis(TIMESTAMPTZ, TIMESTAMPTZ) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_kpis(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_kpis(TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

-- ============================================
-- 2. admin_list_users — ALL known overloads
-- ============================================

-- Overload 1: Original no-params version (from migration 007, may still exist)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'admin_list_users'
    AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON FUNCTION public.admin_list_users() FROM anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.admin_list_users() TO service_role';
  END IF;
END $$;

-- Overload 2: 5-param version (from migration 022, may still exist)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'admin_list_users'
    AND pg_get_function_identity_arguments(p.oid) = 
      'p_date_from timestamp with time zone, p_date_to timestamp with time zone, p_page integer, p_limit integer, p_search text'
  ) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.admin_list_users(TIMESTAMPTZ, TIMESTAMPTZ, INT, INT, TEXT) FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON FUNCTION public.admin_list_users(TIMESTAMPTZ, TIMESTAMPTZ, INT, INT, TEXT) FROM anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.admin_list_users(TIMESTAMPTZ, TIMESTAMPTZ, INT, INT, TEXT) TO authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.admin_list_users(TIMESTAMPTZ, TIMESTAMPTZ, INT, INT, TEXT) TO service_role';
  END IF;
END $$;

-- Overload 3: 7-param version (from migration 023, current production version)
REVOKE ALL ON FUNCTION public.admin_list_users(TIMESTAMPTZ, TIMESTAMPTZ, INT, INT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_users(TIMESTAMPTZ, TIMESTAMPTZ, INT, INT, TEXT, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users(TIMESTAMPTZ, TIMESTAMPTZ, INT, INT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users(TIMESTAMPTZ, TIMESTAMPTZ, INT, INT, TEXT, TEXT, TEXT) TO service_role;

-- ============================================
-- 3. admin_total_users(TIMESTAMPTZ, TIMESTAMPTZ)
-- ============================================
REVOKE ALL ON FUNCTION public.admin_total_users(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_total_users(TIMESTAMPTZ, TIMESTAMPTZ) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_total_users(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_total_users(TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

-- ============================================
-- 4. admin_total_paid_users(TIMESTAMPTZ, TIMESTAMPTZ)
-- ============================================
REVOKE ALL ON FUNCTION public.admin_total_paid_users(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_total_paid_users(TIMESTAMPTZ, TIMESTAMPTZ) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_total_paid_users(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_total_paid_users(TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

-- ============================================
-- 5. admin_total_storage_mb(TIMESTAMPTZ, TIMESTAMPTZ)
--    NOTE: This function was created directly in PROD SQL Editor,
--    not from a migration file. We still need to lock it down.
-- ============================================
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'admin_total_storage_mb'
  ) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.admin_total_storage_mb(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON FUNCTION public.admin_total_storage_mb(TIMESTAMPTZ, TIMESTAMPTZ) FROM anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.admin_total_storage_mb(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.admin_total_storage_mb(TIMESTAMPTZ, TIMESTAMPTZ) TO service_role';
  END IF;
END $$;

-- ============================================
-- 6. get_user_email(UUID)
--    CRITICAL: This was GRANT TO authenticated, allowing ANY logged-in
--    user to resolve any UUID to an email address (PII leak).
--    Restricting to service_role only.
-- ============================================
REVOKE ALL ON FUNCTION public.get_user_email(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_email(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.get_user_email(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_email(UUID) TO service_role;

-- ============================================
-- 7. debug_my_access() — cleanup if exists
-- ============================================
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'debug_my_access'
  ) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.debug_my_access() FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON FUNCTION public.debug_my_access() FROM anon';
    -- Do not grant to anyone — this should not exist in production
  END IF;
END $$;

-- ============================================
-- 8. check_if_admin — ALL known overloads
--    Not critically sensitive (returns boolean, has no side effects),
--    but no reason for anon to call it.
--    OWASP A01: defense-in-depth hardening.
-- ============================================

-- Overload A: check_if_admin() — no args (legacy, may exist in PROD)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'check_if_admin'
    AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.check_if_admin() FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON FUNCTION public.check_if_admin() FROM anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.check_if_admin() TO authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.check_if_admin() TO service_role';
  END IF;
END $$;

-- Overload B: check_if_admin(uuid) — current version (migration 021)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'check_if_admin'
    AND pg_get_function_identity_arguments(p.oid) = 'p_user_id uuid'
  ) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.check_if_admin(UUID) FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON FUNCTION public.check_if_admin(UUID) FROM anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.check_if_admin(UUID) TO authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.check_if_admin(UUID) TO service_role';
  END IF;
END $$;

-- ============================================
-- VERIFICATION QUERY (run after applying):
-- ============================================
-- SELECT routine_name, grantee, privilege_type
-- FROM information_schema.routine_privileges
-- WHERE routine_schema = 'public'
--   AND grantee IN ('anon', 'PUBLIC')
-- ORDER BY routine_name, grantee;
--
-- Expected: ZERO rows for admin_*, get_user_email, debug_my_access
