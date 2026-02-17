
-- Drop the overly strict index created in 010_harden_verification.sql
drop index if exists confirmation_events_token_id_key;

-- Create a more flexible index that allows multiple events per token, 
-- but prevents duplicate identical decisions/actions for the same token.
-- Since the table has a 'decision' column (enum-like logic), we'll use that.
-- Effectively: A token can only result in ONE definitive decision record.
-- If we later add other event types (e.g. 'viewed', 'expired'), we might need a 'type' column.
-- For now, 'decision' acts as the discriminator for the main action, and since the token is one-time, 
-- getting one decision per token IS actually what we want for this specific table structure.

-- However, the user request implies we might want to log multiple *types* of events.
-- The current table 'confirmation_events' has a 'decision' column which is basically the event type ('confirm' or 'deny').
-- So UNIQUE(token_id, decision) essentially means:
-- You can't log 'confirm' twice for the same token.
-- You can't log 'deny' twice for the same token.
-- (But technically you could have both if the app logic allowed it, which it shouldn't for one-time tokens).

-- If we strictly want one outcome per token (which verify-status enforces), 
-- then `token_id` UNIQUE is actually correct for the *outcome*.
-- BUT if we want to log 'view_page', 'click_button', etc., then we need (token_id, event_invoked).
-- Since 'decision' is the only variable column besides metadata, we'll index on that.

create unique index if not exists idx_confirmation_events_token_decision 
on public.confirmation_events(token_id, decision) 
where token_id is not null;

-- This allows re-logging if we ever support a flow where a user denies, then confirms (unlikely for one-time, but better for data hygiene).
-- For stricter one-decision-only storage, the app logic `used_at` check is the primary guard.
