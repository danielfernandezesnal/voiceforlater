-- Fix ambiguous column reference in admin_list_users function by using explicit table aliases
-- This replaces the existing function with a corrected version

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  email varchar,
  role public.app_role,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.id,
    au.email::varchar,
    COALESCE(ur.role, 'user'::public.app_role) as role,
    au.created_at,
    au.last_sign_in_at
  FROM auth.users au
  LEFT JOIN public.user_roles ur ON au.id = ur.user_id
  ORDER BY au.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users TO authenticated;
