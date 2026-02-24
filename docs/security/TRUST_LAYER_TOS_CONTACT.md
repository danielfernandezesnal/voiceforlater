# Trust Layer v1: ToS & Contact Architecture

## Objective
Implement mandatory Terms of Service acceptance before message creation, and establish a Contact ticket system. 

## Schema Changes
### `public.profiles`
- Added `tos_version` (TEXT): Tracks the specific version of Terms accepted.
- Added `tos_accepted_at` (TIMESTAMPTZ): Tracks timestamp of acceptance.

### `public.contact_tickets`
- Primary ticket store for user inquiries.
- Includes RLS to strictly prevent default `anon`/`authenticated` inserts. 
- API securely creates inserts via `service_role`.
- `is_admin()` policy grants read/update permissions to admin users.

### Events Audit
- Type `tos_accepted` added to the `public.events` audit log schema.
- Tracks `{ version, ip_address, user_agent }`.

## Backend Enforcement (Defense-in-Depth)
1. **Next.js Gateway:** 
   - Uses `REQUIRED_TOS_VERSION` configuration in `lib/constants.ts`.
   - Returns 403 `TOS_REQUIRED` if version mismatched or unaccepted.
2. **Supabase Database Trigger:**
   - A `BEFORE INSERT` trigger on `public.messages` utilizing `enforce_tos_before_message()`.
   - Prevents bypasses via PostgREST by validating `auth.uid()` against `tos_accepted_at`.
   - Prevents owner_id spoofing at the trigger level as well.

## Rollout
- Enforced on production with no downtime. 
- Schema changes driven via the Supabase migration pipeline. 
