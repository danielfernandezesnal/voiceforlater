
-- Drop previous index attempts safely
drop index if exists confirmation_events_token_id_key;
drop index if exists idx_confirmation_events_token_decision;

-- Add 'type' column to differentiate event kinds (e.g. 'decision', 'expired', 'released')
-- Default to 'decision' for existing rows to maintain data integrity
alter table public.confirmation_events 
add column if not exists event_type text not null default 'decision';

-- Create the correct unique index:
-- A token can have only ONE event of a specific type.
-- e.g. One 'decision' (confirm/deny), one 'released', one 'expired'.
create unique index idx_confirmation_events_token_type 
on public.confirmation_events(token_id, event_type) 
where token_id is not null;

-- This guarantees:
-- 1. We can audit multiple distinct steps (viewed -> decision -> released).
-- 2. We cannot duplicate the SAME step (e.g. double release log).
