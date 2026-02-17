
-- Consolidated Verification Setup (Migrations 009-014)
-- Run this in Supabase SQL Editor to apply all missing schema changes.

-- 1. Create Verification Tokens Table
create table if not exists public.verification_tokens (
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

-- 2. Create Confirmation Events Table
create table if not exists public.confirmation_events (
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

-- 3. Create Indexes
create index if not exists idx_verification_tokens_token_hash on public.verification_tokens(token_hash);
create unique index if not exists idx_confirmation_events_token_canonical_type on public.confirmation_events(token_id, type) where token_id is not null;

-- 4. Enable RLS
alter table public.verification_tokens enable row level security;
alter table public.confirmation_events enable row level security;

-- 5. Create Service Role Policies (Idempotent)
do $$
begin
    if not exists (select 1 from pg_policies where policyname = 'Service role can manage verification tokens') then
        create policy "Service role can manage verification tokens" on public.verification_tokens using (auth.role() = 'service_role');
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Service role can manage confirmation events') then
        create policy "Service role can manage confirmation events" on public.confirmation_events using (auth.role() = 'service_role');
    end if;
end
$$;

-- 6. Reload Schema Cache
notify pgrst, 'reload schema';

-- Verification Queries (Run these to confirm)
-- select to_regclass('public.verification_tokens');
-- select to_regclass('public.confirmation_events');
