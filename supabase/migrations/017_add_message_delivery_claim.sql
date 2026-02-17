
-- Add delivery_claimed_at to messages table to enforce strictly-once delivery semantics
-- This allows us to "claim" a message atomically without changing its visible user status from 'scheduled' to 'delivered' prematurely, avoiding constraint violations.

alter table public.messages 
add column if not exists delivery_claimed_at timestamptz default null;

-- Add index to support efficient claiming
create index if not exists idx_messages_status_claimed 
on public.messages(status, delivery_claimed_at) 
where status = 'scheduled';
