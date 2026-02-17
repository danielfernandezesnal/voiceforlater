
-- Remove 'decision' from verification_tokens to enforce separation of concerns.
-- The token table tracks lifecycle (created, expired, used).
-- The confirmation_events table tracks the semantic outcome (decision made).

-- 1. Drop the decision column
alter table public.verification_tokens 
drop column if exists decision;

-- 2. Add 'used_reason' for audit trail on lifecycle
alter table public.verification_tokens 
add column if not exists used_reason text;
-- e.g. 'user_action', 'expired_auto'
