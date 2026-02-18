-- Create product_events table
create table public.product_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid null, -- Nullable for anonymous/pre-signup events (if needed) but prompt says "Validate authenticated session" for API.
    event_name text not null,
    metadata jsonb null,
    created_at timestamptz default now()
);

-- Indexes for analytics queries
create index idx_product_events_name_created on public.product_events(event_name, created_at);
create index idx_product_events_user_created on public.product_events(user_id, created_at);

-- RLS
alter table public.product_events enable row level security;

-- Policy: Only service role can insert (no public/auth insert policy)
-- Policy: No public select (only service role can select for admin dashboard)
-- So we strictly define NO policies for anon/authenticated roles.
-- This effectively blocks all client-side access unless using service role.
