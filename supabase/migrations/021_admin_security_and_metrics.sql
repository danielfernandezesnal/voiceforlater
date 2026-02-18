-- 021_admin_security_and_metrics.sql

-- 1. Ensure Role-Based Security Foundation
DO $$ 
BEGIN
    -- Create app_role type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'owner');
    END IF;
    
    -- Create user_roles table if it doesn't exist (Assimilate 007 assumption)
    CREATE TABLE IF NOT EXISTS public.user_roles (
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        role public.app_role NOT NULL DEFAULT 'user',
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Enable RLS on user_roles
    ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

    -- Create policy for user_roles (Admins can view all, users can view own?)
    -- Only admins/service role should verify roles generally, but for now:
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Admins can view all roles') THEN
        CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT
        USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'owner')));
    END IF;

    -- Ensure email_events table exists (Idempotent from 005)
    CREATE TABLE IF NOT EXISTS public.email_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      to_email TEXT NOT NULL,
      email_type TEXT NOT NULL,
      provider_message_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT,
      sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Ensure file_size_bytes on messages (Idempotent from 005)
    ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;
    
    -- Ensure indexes exist (Idempotent)
    CREATE INDEX IF NOT EXISTS idx_messages_file_size ON public.messages(owner_id, file_size_bytes);
    CREATE INDEX IF NOT EXISTS idx_email_events_user ON public.email_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_email_events_created ON public.email_events(created_at);
END $$;

-- 2. Create authoritative check_if_admin function
CREATE OR REPLACE FUNCTION public.check_if_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin_profile BOOLEAN;
    v_has_role BOOLEAN;
BEGIN
    -- Check profiles (Migration 005 source)
    SELECT is_admin INTO v_is_admin_profile FROM public.profiles WHERE id = p_user_id;
    
    -- Check user_roles (Migration 007 source)
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = p_user_id 
        AND role IN ('admin', 'owner')
    ) INTO v_has_role;

    RETURN COALESCE(v_is_admin_profile, FALSE) OR COALESCE(v_has_role, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Admin KPIs RPC
CREATE OR REPLACE FUNCTION public.admin_kpis(
    p_date_from TIMESTAMPTZ DEFAULT NULL, 
    p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_total_users BIGINT;
    v_paid_users BIGINT;
    v_storage_bytes BIGINT;
    v_emails_sent BIGINT;
BEGIN
    -- Secure Guard
    IF NOT public.check_if_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access Denied: Admin privileges required.';
    END IF;

    -- Total Users (Created within range)
    SELECT COUNT(*) INTO v_total_users
    FROM auth.users
    WHERE (p_date_from IS NULL OR created_at >= p_date_from)
      AND (p_date_to IS NULL OR created_at <= p_date_to);

    -- Paid Users (Active Pro Subscriptions)
    -- Intentionally independent of creation date (shows Current Active)
    -- If date filtering is strictly required for "became paid": 
    -- WHERE updated_at ... but normally "Active" is state. 
    -- Let's stick to Current Active for utility.
    SELECT COUNT(*) INTO v_paid_users
    FROM public.user_subscriptions
    WHERE plan = 'pro' 
      AND status IN ('active', 'trialing')
      AND (current_period_end IS NULL OR current_period_end > NOW());

    -- Storage (Messages created within range)
    SELECT COALESCE(SUM(file_size_bytes), 0) INTO v_storage_bytes
    FROM public.messages
    WHERE (p_date_from IS NULL OR created_at >= p_date_from)
      AND (p_date_to IS NULL OR created_at <= p_date_to);

    -- Emails Sent (Events within range)
    -- Ensure email_events exists (from 005)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create Admin List Users RPC
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
) AS $$
DECLARE
    v_offset INT;
BEGIN
    -- Secure Guard
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
        -- Contacts (Current total, ignored range usually for this)
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
        -- Do NOT filter by au.created_at so we see activity for all users
        (p_search IS NULL OR au.email ILIKE '%' || p_search || '%')
    ORDER BY au.created_at DESC
    LIMIT p_limit OFFSET v_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Ensure Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON public.email_events(created_at);
-- user_subscriptions indexes added in 020

