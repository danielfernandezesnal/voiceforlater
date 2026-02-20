-- Migration: Add admin_total_users function for KPI tracking
-- Description: Returns total count of registered profiles within a date range.

CREATE OR REPLACE FUNCTION public.admin_total_users(start_date timestamptz, end_date timestamptz)
RETURNS bigint AS $$
DECLARE
    v_count bigint;
BEGIN
    -- Secure Guard: Use existing check_if_admin helper
    -- This checks both public.profiles.is_admin and public.user_roles (admin/owner)
    IF NOT public.check_if_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied: Admin privileges required.';
    END IF;

    SELECT count(*) INTO v_count
    FROM public.profiles
    WHERE (start_date IS NULL OR created_at >= start_date)
      AND (end_date IS NULL OR created_at <= end_date);

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Limit execution permissions
REVOKE ALL ON FUNCTION public.admin_total_users(timestamptz, timestamptz) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_total_users(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_total_users(timestamptz, timestamptz) TO service_role;
