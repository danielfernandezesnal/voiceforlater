-- Migration 6B: Admin Actions (Override & Delete)

-- 1. Create admin_overrides table
CREATE TABLE IF NOT EXISTS public.admin_overrides (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_override TEXT CHECK (plan_override IN ('free', 'pro')),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS for admin_overrides (Admin only)
ALTER TABLE public.admin_overrides ENABLE ROW LEVEL SECURITY;

-- If a policy already exists, this might fail in some environments, but for idempotent migrations we check or drop.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin only select overrides' AND tablename = 'admin_overrides') THEN
        CREATE POLICY "Admin only select overrides" ON public.admin_overrides
            FOR SELECT TO authenticated USING (public.check_if_admin(auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin only insert overrides' AND tablename = 'admin_overrides') THEN
        CREATE POLICY "Admin only insert overrides" ON public.admin_overrides
            FOR INSERT TO authenticated WITH CHECK (public.check_if_admin(auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin only update overrides' AND tablename = 'admin_overrides') THEN
        CREATE POLICY "Admin only update overrides" ON public.admin_overrides
            FOR UPDATE TO authenticated USING (public.check_if_admin(auth.uid())) WITH CHECK (public.check_if_admin(auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin only delete overrides' AND tablename = 'admin_overrides') THEN
        CREATE POLICY "Admin only delete overrides" ON public.admin_overrides
            FOR DELETE TO authenticated USING (public.check_if_admin(auth.uid()));
    END IF;
END $$;

-- 2. Update admin_list_users to include override info
CREATE OR REPLACE FUNCTION public.admin_list_users(
    p_date_from TIMESTAMPTZ DEFAULT NULL,
    p_date_to TIMESTAMPTZ DEFAULT NULL,
    p_page INT DEFAULT 1,
    p_limit INT DEFAULT 20,
    p_search TEXT DEFAULT NULL,
    p_plan TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    created_at TIMESTAMPTZ,
    plan TEXT,
    status TEXT,
    renewal_date TIMESTAMPTZ,
    messages_count BIGINT,
    contacts_count BIGINT,
    storage_mb NUMERIC,
    emails_sent BIGINT,
    plan_override TEXT,
    effective_plan TEXT
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
    v_offset INT;
BEGIN
    -- Secure Guard: Verify admin/owner
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
        sub.current_period_end AS renewal_date,
        (SELECT COUNT(*) FROM public.messages m 
         WHERE m.owner_id = au.id
         AND (p_date_from IS NULL OR m.created_at >= p_date_from)
         AND (p_date_to IS NULL OR m.created_at <= p_date_to)
        ) AS messages_count,
        (SELECT COUNT(*) FROM public.trusted_contacts tc WHERE tc.user_id = au.id) AS contacts_count,
        (SELECT round(COALESCE(SUM(m.file_size_bytes), 0)::numeric / 1024 / 1024, 2) 
         FROM public.messages m 
         WHERE m.owner_id = au.id
         AND (p_date_from IS NULL OR m.created_at >= p_date_from)
         AND (p_date_to IS NULL OR m.created_at <= p_date_to)
        ) AS storage_mb,
        (SELECT COUNT(*) FROM public.email_events ee 
         WHERE ee.user_id = au.id
         AND (p_date_from IS NULL OR ee.created_at >= p_date_from)
         AND (p_date_to IS NULL OR ee.created_at <= p_date_to)
        ) AS emails_sent,
        ov.plan_override,
        COALESCE(ov.plan_override, sub.plan, 'free') AS effective_plan
    FROM auth.users au
    LEFT JOIN public.user_subscriptions sub ON au.id = sub.user_id
    LEFT JOIN public.admin_overrides ov ON au.id = ov.user_id
    WHERE 
        (p_search IS NULL OR au.email ILIKE '%' || p_search || '%')
        AND (p_plan IS NULL OR COALESCE(ov.plan_override, sub.plan, 'free') = p_plan)
        AND (p_status IS NULL OR COALESCE(sub.status, 'inactive') = p_status)
    ORDER BY au.created_at DESC
    LIMIT p_limit OFFSET v_offset;
END;
$$;

-- Refix permissions (must use same signature)
REVOKE ALL ON FUNCTION public.admin_list_users(timestamptz,timestamptz,int,int,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users(timestamptz,timestamptz,int,int,text,text,text) TO authenticated;
