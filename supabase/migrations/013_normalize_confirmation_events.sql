
-- Normalize confirmation_events to use a canonical 'type' column.

-- 1. Drop old index to prepare for changes
drop index if exists idx_confirmation_events_token_type;

-- 2. Add 'type' column (canonical)
alter table public.confirmation_events 
add column if not exists type text;

-- 3. Data Migration
-- If we have existing rows (likely only 'decision' type with 'confirm'/'deny' decision)
update public.confirmation_events
set type = case 
    when event_type = 'decision' then 'decision_' || decision 
    else event_type 
end
where type is null;

-- Default fallback if something matched nothing (unlikely)
update public.confirmation_events set type = 'unknown' where type is null;

-- 4. Enforce Not Null on new column
alter table public.confirmation_events 
alter column type set not null;

-- 5. Relax constraints on 'decision' (it might be null for non-decision events like 'viewed')
alter table public.confirmation_events 
alter column decision drop not null;

-- (Optional) If there's a CHECK constraint on decision, we might want to drop or verify it allows NULL.
-- In Supabase/Postgres, CHECK constraints are usually ignored for NULL unless "CHECK (decision IS NOT NULL)", which is covered by column NOT NULL.
-- Since we dropped NOT NULL, check should pass for NULLs.

-- 6. Cleanup old column
alter table public.confirmation_events 
drop column if exists event_type;

-- 7. Create the new Canonical Unique Index
create unique index idx_confirmation_events_token_canonical_type 
on public.confirmation_events(token_id, type) 
where token_id is not null;
