-- Create table to track processed stripe events for idempotency
create table if not exists stripe_webhook_events (
  id uuid default gen_random_uuid() primary key,
  stripe_event_id text unique not null,
  event_type text not null,
  created_at timestamptz default now()
);

-- Add RLS policies (only service role should access this, no public access)
alter table stripe_webhook_events enable row level security;

-- No policies needed for service role as it bypasses RLS, ensuring no one else can read/write
