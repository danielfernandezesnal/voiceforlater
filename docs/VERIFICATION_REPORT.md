
# Verification Report: Expired Token Flow

## 1. Test Execution
- **Target:** Deployed Environment (via generic API client)
- **User ID:** `b1ddd7d5-5882-4a4b-b830-96c2c39fe821` (Testing User)
- **Strategy:**
    1. Setup: Insert expired token + message via `/api/debug/test-expired`
    2. Trigger: Call `/api/cron/process-expired-tokens` (x2)
    3. Verify: Check DB state via `/api/debug/test-expired`

## 2. Results
**Status:** 🔴 FAILED (Setup Phase)

**Error Log:**
```json
{
  "error": "Token Error: Could not find the table 'public.verification_tokens' in the schema cache"
}
```

## 3. Root Cause Analysis
The `verification_tokens` table is missing from the PostgREST schema cache. This indicates that **database migrations have not been applied** to the target environment.

**Missing Migrations:**
- `009_create_verification_tables.sql` (Creates table)
- `010_harden_verification.sql`
- `011_fix_confirmation_events_uniqueness.sql`
- `012_fix_confirmation_events_unique_rule.sql`
- `013_normalize_confirmation_events.sql`
- `014_remove_token_decision.sql`
- `015_reload_schema.sql` (Reloads cache)

## 4. Remediation
Please execute the following SQL command in your Supabase SQL Editor to apply all pending schema changes and reload the cache.

```sql
-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.verification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  contact_email text not null,
  token_hash text not null unique,
  action text not null default 'verify-status',
  expires_at timestamptz not null,
  used_at timestamptz null,
  used_ip text null,
  used_user_agent text null,
  used_reason text, -- Added in 014
  created_at timestamptz not null default now()
);

ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.confirmation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  contact_email text not null,
  token_id uuid references public.verification_tokens(id) on delete set null,
  type text not null, -- Normalized in 013
  decision text, -- Relaxed in 013
  ip_address text null,
  user_agent text null,
  created_at timestamptz not null default now(),
  UNIQUE(token_id, type) -- Final unique rule
);

ALTER TABLE public.confirmation_events ENABLE ROW LEVEL SECURITY;

-- 2. Create Service Role Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage verification tokens') THEN
        CREATE POLICY "Service role can manage verification tokens" ON public.verification_tokens USING (auth.role() = 'service_role');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage confirmation events') THEN
        CREATE POLICY "Service role can manage confirmation events" ON public.confirmation_events USING (auth.role() = 'service_role');
    END IF;
END
$$;

-- 3. Create Indexes
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token_hash ON public.verification_tokens(token_hash);
CREATE UNIQUE INDEX IF NOT EXISTS idx_confirmation_events_token_canonical_type ON public.confirmation_events(token_id, type) WHERE token_id IS NOT NULL;

-- 4. Reload Schema Cache
NOTIFY pgrst, 'reload schema';
```

## 5. Next Steps
Once the SQL above is run, re-run the verification manually using the created debug routes:
```bash
# Setup
curl -X POST http://localhost:3000/api/debug/test-expired

# Trigger Cron
curl http://localhost:3000/api/cron/process-expired-tokens

# Verify
curl http://localhost:3000/api/debug/test-expired
```
