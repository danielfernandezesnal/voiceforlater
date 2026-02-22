-- 022_harden_admin_list_users.sql
-- Harden the admin_list_users function with search_path and correct permissions

CREATE OR REPLACE FUNCTION public.admin_list_users(
    p_date_from TIMESTAMPTZ DEFAULT NULL,
    p_date_to TIMESTAMPTZ DEFAULT NULL,
    p_page INT DEFAULT 1,
    p_limit INT DEFAULT 20,
    p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    created_at TIMESTAMPTZ,
    plan TEXT,
    status TEXT,
    messages_count BIGINT,
    contacts_count BIGINT,
    storage_mb NUMERIC,
    emails_sent BIGINT
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth
AS $$
DECLARE
    v_offset INT;
BEGIN
    -- Secure Guard: Verify that the caller is an admin or owner
    -- This relies on auth.uid() being set (passed from the client)
    IF NOT public.check_if_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied: Admin privileges required.';
    END IF;

    v_offset := (p_page - 1) * p_limit;

    RETURN QUERY
    SELECT 
        au.id,
        au.email::TEXT,
        au.created_at,
        COALESCE(sub.plan, 'free') AS plan,
        COALESCE(sub.status, 'inactive') AS status,
        -- Count messages in range
        (SELECT COUNT(*) FROM public.messages m 
         WHERE m.owner_id = au.id
         AND (p_date_from IS NULL OR m.created_at >= p_date_from)
         AND (p_date_to IS NULL OR m.created_at <= p_date_to)
        ) AS messages_count,
        -- Contacts (Current total)
        (SELECT COUNT(*) FROM public.trusted_contacts tc WHERE tc.user_id = au.id) AS contacts_count,
        -- Storage (Sum of messages created in range)
        (SELECT round(COALESCE(SUM(m.file_size_bytes), 0)::numeric / 1024 / 1024, 2) 
         FROM public.messages m 
         WHERE m.owner_id = au.id
         AND (p_date_from IS NULL OR m.created_at >= p_date_from)
         AND (p_date_to IS NULL OR m.created_at <= p_date_to)
        ) AS storage_mb,
        -- Emails (In range)
        (SELECT COUNT(*) FROM public.email_events ee 
         WHERE ee.user_id = au.id
         AND (p_date_from IS NULL OR ee.created_at >= p_date_from)
         AND (p_date_to IS NULL OR ee.created_at <= p_date_to)
        ) AS emails_sent
    FROM auth.users au
    LEFT JOIN public.user_subscriptions sub ON au.id = sub.user_id
    WHERE 
        (p_search IS NULL OR au.email ILIKE '%' || p_search || '%')
    ORDER BY au.created_at DESC
    LIMIT p_limit OFFSET v_offset;
END;
$$;

-- Revoke all permissions from public for admin_list_users
REVOKE ALL ON FUNCTION public.admin_list_users(TIMESTAMPTZ, TIMESTAMPTZ, INT, INT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users(TIMESTAMPTZ, TIMESTAMPTZ, INT, INT, TEXT) TO authenticated;

-- Also harden admin_kpis while we are at it (Best Practice)
CREATE OR REPLACE FUNCTION public.admin_kpis(
    p_date_from TIMESTAMPTZ DEFAULT NULL, 
    p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth
AS $$
DECLARE
    v_total_users BIGINT;
    v_paid_users BIGINT;
    v_storage_bytes BIGINT;
    v_emails_sent BIGINT;
BEGIN
    -- Secure Guard: Verify admin/owner
    IF NOT public.check_if_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied: Admin privileges required.';
    END IF;

    -- Total Users
    SELECT COUNT(*) INTO v_total_users
    FROM auth.users
    WHERE (p_date_from IS NULL OR created_at >= p_date_from)
      AND (p_date_to IS NULL OR created_at <= p_date_to);

    -- Paid Users (Current Active State)
    SELECT COUNT(*) INTO v_paid_users
    FROM public.user_subscriptions
    WHERE plan = 'pro' 
      AND status IN ('active', 'trialing')
      AND (current_period_end IS NULL OR current_period_end > NOW());

    -- Storage
    SELECT COALESCE(SUM(file_size_bytes), 0) INTO v_storage_bytes
    FROM public.messages
    WHERE (p_date_from IS NULL OR created_at >= p_date_from)
      AND (p_date_to IS NULL OR created_at <= p_date_to);

    -- Emails Sent
    SELECT COUNT(*) INTO v_emails_sent
    FROM public.email_events
    WHERE (p_date_from IS NULL OR created_at >= p_date_from)
      AND (p_date_to IS NULL OR created_at <= p_date_to);

    RETURN jsonb_build_object(
        'total_users', v_total_users,
        'paid_users', v_paid_users,
        'storage_mb', round((v_storage_bytes::numeric / 1024 / 1024), 2),
        'emails_sent', v_emails_sent
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_kpis(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_kpis(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
