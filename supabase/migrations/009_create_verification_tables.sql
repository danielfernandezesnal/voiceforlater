-- Create table for secure one-time tokens
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
  decision text null check (decision in ('confirm', 'deny')),
  created_at timestamptz not null default now()
);

-- Enable RLS (though mostly used by server-side code)
alter table public.verification_tokens enable row level security;

-- Create table for audit logs
create table if not exists public.confirmation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  contact_email text not null,
  decision text not null check (decision in ('confirm', 'deny')),
  token_id uuid references public.verification_tokens(id) on delete set null,
  ip_address text null,
  user_agent text null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.confirmation_events enable row level security;

-- Only service role can access these tables directly for now
create policy "Service role can manage verification tokens"
  on public.verification_tokens
  using (auth.role() = 'service_role');

create policy "Service role can manage confirmation events"
  on public.confirmation_events
  using (auth.role() = 'service_role');
