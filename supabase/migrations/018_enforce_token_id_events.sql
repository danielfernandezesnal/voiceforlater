
-- Enforce token_id presence for critical flow events to prevent duplicates and ensure traceabiity
-- We use a partial check constraint logic: specific types MUST have token_id

alter table public.confirmation_events
add constraint check_token_required_for_flow
check (
  case 
    when type in ('token_expired', 'messages_released_auto', 'decision_confirm', 'decision_deny') 
    then token_id is not null 
    else true 
  end
);

-- Note: We rely on existing unique index (token_id, type) to prevent duplicates once token_id is non-null.
