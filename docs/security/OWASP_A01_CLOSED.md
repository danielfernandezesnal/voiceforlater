# OWASP A01 – Broken Access Control (CLOSED)

## Summary
Fixed EXECUTE exposure for SECURITY DEFINER admin RPCs.

## Fix
Migration added:
- supabase/migrations/025_revoke_anon_execute_admin_rpcs.sql

Key changes:
- REVOKE EXECUTE from PUBLIC and anon for sensitive functions
- GRANT EXECUTE only to authenticated and service_role
- get_user_email restricted to service_role only
- Handles overloads with IF EXISTS guards

## PROD Verification
Query:
```sql
SELECT routine_name, grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema='public'
  AND grantee IN ('anon','PUBLIC')
  AND routine_name IN (
    'admin_kpis',
    'admin_list_users',
    'admin_total_users',
    'admin_total_paid_users',
    'admin_total_storage_mb',
    'get_user_email',
    'debug_my_access',
    'check_if_admin'
  )
ORDER BY routine_name, grantee;
```

Result:
- 0 rows returned for the above routines.

## Notes
- `handle_new_user` / `handle_new_user_role` are trigger functions; not callable via RPC.
- Supabase CLI migrations table does not exist in PROD; migration workflow needs bootstrap.
