
-- Harden verification tables

-- Ensure a token can only generate ONE confirmation event
-- (This prevents double-logging if the API is hit twice quickly despite application checks)
create unique index if not exists confirmation_events_token_id_key 
on public.confirmation_events(token_id) 
where token_id is not null;

-- Ensure tokens are strictly one-time at DB level if not already covered by app logic
-- (The used_at logic in app is good, but let's ensure we can't have multiple successful updates)
-- We rely on conditional update in the API, but a trigger could enforce constraints if needed.
-- For MVP, the unique index on confirmation_events + application logic is sufficient.

-- Add specific index for performance on verify-status queries
create index if not exists idx_verification_tokens_token_hash 
on public.verification_tokens(token_hash);

create index if not exists idx_messages_owner_status_mode 
on public.messages(owner_id, status);
