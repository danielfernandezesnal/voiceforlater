# PR 6A: Admin Dashboard Enhancements - Review Pack

## Snapshot Information
- **Branch:** `main` (working tree, uncommitted)
- **Base Hash:** `a072e9e`
- **Status:** Build Passed (`npm run build`), Type Check Passed (`tsc --noEmit`)
- **Main Objective:** Improve admin user management, fix locale behavior, and harden security.

## Summary of Changes

### 1. Internationalization & COPY LOCK
- **Fix:** Symmetric `messages/en.json` and `messages/es.json`.
- **Labels:** Added `planPro`, `planFree` and specific subscription status labels (`statusActive`, `statusTrialing`, etc.).
- **Auth:** Updated English auth labels to "Log in" and "Log out".
- **Rule:** Removed all hardcoded user-facing strings in `UserTable.tsx` and filters.

### 2. Middleware Locale Behavior
- **Logic:** Admin routes now default to Spanish (`/es/admin`) only when accessed without a locale prefix (e.g., `/admin`).
- **Correction:** Removed the global redirect that forced English admin routes to Spanish. Explicit `/en/admin` access is now fully supported and respected.

### 3. SQL Security Hardening
- **Implementation:** Updated `admin_list_users` RPC in `20260225210000_update_admin_list_users_renewal.sql`.
- **Search Path:** Set to `pg_catalog, public, auth` to prevent search path hijacking.
- **Permissions:** 
    - `REVOKE ALL` from `PUBLIC` for the specific function signature.
    - `GRANT EXECUTE` to `authenticated` role only.
- **Protection:** Internal `check_if_admin(auth.uid())` guard remains active.

---

## File Statistics
```text
 app/[locale]/admin/admin-dashboard-client.tsx |  34 +++---
 app/[locale]/admin/layout.tsx                 |   9 +-
 app/[locale]/admin/page.tsx                   |   7 +-
 app/[locale]/admin/users/page.tsx             |  11 +-
 components/admin/AdminSidebar.tsx             |   9 +-
 components/admin/AdminHeader.tsx (New)        |  33 +++++
 components/admin/UserTable.tsx                | 167 +++++++++++++++-----------
 messages/en.json                              |  20 ++-
 messages/es.json                              |  16 +++
 middleware.ts                                 |   4 +-
 supabase/migrations/20260225210000_update_admin_list_users_renewal.sql (New)
```

---

## SQL Migration Content

```sql
-- Update admin_list_users to include current_period_end
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
    emails_sent BIGINT
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
        -- Count messages in range
        (SELECT COUNT(*) FROM public.messages m 
         WHERE m.owner_id = au.id
         AND (p_date_from IS NULL OR m.created_at >= p_date_from)
         AND (p_date_to IS NULL OR m.created_at <= p_date_to)
        ) AS messages_count,
        -- Contacts
        (SELECT COUNT(*) FROM public.trusted_contacts tc WHERE tc.user_id = au.id) AS contacts_count,
        -- Storage
        (SELECT round(COALESCE(SUM(m.file_size_bytes), 0)::numeric / 1024 / 1024, 2) 
         FROM public.messages m 
         WHERE m.owner_id = au.id
         AND (p_date_from IS NULL OR m.created_at >= p_date_from)
         AND (p_date_to IS NULL OR m.created_at <= p_date_to)
        ) AS storage_mb,
        -- Emails
        (SELECT COUNT(*) FROM public.email_events ee 
         WHERE ee.user_id = au.id
         AND (p_date_from IS NULL OR ee.created_at >= p_date_from)
         AND (p_date_to IS NULL OR ee.created_at <= p_date_to)
        ) AS emails_sent
    FROM auth.users au
    LEFT JOIN public.user_subscriptions sub ON au.id = sub.user_id
    WHERE 
        (p_search IS NULL OR au.email ILIKE '%' || p_search || '%')
        AND (p_plan IS NULL OR COALESCE(sub.plan, 'free') = p_plan)
        AND (p_status IS NULL OR COALESCE(sub.status, 'inactive') = p_status)
    ORDER BY au.created_at DESC
    LIMIT p_limit OFFSET v_offset;
END;
$$;

-- Revoke and grant permissions
REVOKE ALL ON FUNCTION public.admin_list_users(timestamptz,timestamptz,int,int,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users(timestamptz,timestamptz,int,int,text,text,text) TO authenticated;
```

---

## Security Checklist
- [x] **SECURITY DEFINER:** Used for cross-schema access (auth -> public).
- [x] **Search Path Hardening:** `SET search_path = pg_catalog, public, auth` implemented.
- [x] **Privileged Access:** Function internally checks for admin role.
- [x] **Execution Revoked:** `PUBLIC` access revoked.
- [x] **Execution Granted:** Restricted to `authenticated` role.
- [x] **Copy Lock:** Zero hardcoded labels in `UserTable` or UI components.
- [x] **Middleware:** Locale prefix handling fixed to support multi-language admin.

---

**Generated by Antigravity (Tech Lead)**
