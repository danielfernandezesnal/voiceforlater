
-- 1. Check if tables exist in the registry (returns 'public.tablename' or NULL)
select
  to_regclass('public.verification_tokens') as verification_tokens,
  to_regclass('public.confirmation_events') as confirmation_events;

-- 2. Check information schema for exact table names
select table_name
from information_schema.tables
where table_schema='public'
  and table_name in ('verification_tokens','confirmation_events');

-- 3. (Optional) If tables exist but API gives 404/Schema Cache Error, runs this:
-- notify pgrst, 'reload schema';
