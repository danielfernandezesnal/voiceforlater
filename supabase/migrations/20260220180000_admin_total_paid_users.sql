-- Migration: Add admin_total_paid_users function for KPI tracking
-- Description: Returns total count of users with active 'pro' subscription within a date range.

CREATE OR REPLACE FUNCTION public.admin_total_paid_users(start_date timestamptz, end_date timestamptz)
RETURNS bigint AS $$
DECLARE
    v_count bigint;
BEGIN
    -- Secure Guard: Use existing check_if_admin helper
    IF NOT public.check_if_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied: Admin privileges required.';
    END IF;

    -- Count active 'pro' plans.
    -- We use updated_at as a proxy for when the subscription was created/updated to pro.
    SELECT count(*) INTO v_count
    FROM public.user_subscriptions
    WHERE plan = 'pro'
      AND status IN ('active', 'trialing')
      AND (start_date IS NULL OR updated_at >= start_date)
      AND (end_date IS NULL OR updated_at <= end_date);

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Limit execution permissions
REVOKE ALL ON FUNCTION public.admin_total_paid_users(timestamptz, timestamptz) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_total_paid_users(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_total_paid_users(timestamptz, timestamptz) TO service_role;
