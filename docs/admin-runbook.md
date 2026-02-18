# Admin Dashboard Runbook

## 1. Production Checklist
Before deploying admin dashboard updates:

- [ ] **Data Migrations**: Verify that `public.admin_audit_log` exists.
- [ ] **Analytics Table**: Verify that `public.product_events` exists (see section 5 below).
- [ ] **Environment**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in production.
- [ ] **Role**: Ensure your user has `admin` or `owner` role in `public.user_roles` (add manually if needed via SQL).
- [ ] **i18n**: Check `messages/en.json` and `es.json` for new keys.
- [ ] **Build**: Run local build (`npm run build`) to catch type errors.

## 2. Troubleshooting

### 2.1 Access Denied (403)
**Symptom**: "Access Denied" or "Authorized Access Required".
**Cause**: User lacks `admin` role or session expired.
**Fix**:
1. Check `public.user_roles` for your user ID.
2. Insert row: `INSERT INTO public.user_roles (user_id, role) VALUES ('your-uuid', 'admin');`
3. Retry login.

### 2.2 Rate Limited (429)
**Symptom**: "Too many requests" or UI frozen.
**Cause**: Exceeded 60 requests/minute from your IP.
**Fix**:
1. Wait 60 seconds.
2. If persistent for legitimate usage, increase limit in `lib/admin/utils.ts`.

### 2.3 System Error (500)
**Symptom**: "Something went wrong" or detailed error.
**Cause**: Service Role failure (bad key), Database offline, or unhandled exception.
**Check**:
- Vercel Logs for stack trace.
- `public.admin_audit_log` for the specific failure entry.

### 2.4 Missing Data / Empty Charts
**Symptom**: KPIs show zero when data exists.
**Cause**: Date filters exclude data (timezones?) or row-level security blocking specific queries? No, admin uses `service_role` which bypasses RLS.
**Check**:
- Verify data exists in Supabase for the date range `America/Chicago`.
- `kpis` endpoint caches for 60s. Wait 1 min or restart endpoint (redeploy) to clear cache.

## 3. Safe Extension Guide

### 3.1 Adding a New KPI
1. **Database**: Add query to `app/api/admin/kpis/route.ts` inside the cached block.
2. **Type**: Update `KPIs` interface in `app/[locale]/admin/admin-dashboard-client.tsx`.
3. **UI**: Add `<KPICard />` to grid.
4. **i18n**: Add label to `messages/en.json` -> `admin.kpis.newKey`.

### 3.2 Adding an Export Column
1. **API**: Edit `app/api/admin/users/export/route.ts`.
2. **Logic**: Add field to enrichment loop.
3. **CSV**: Add column header to `headers` array and value to `csvRows`.

### 3.3 Adding a New Admin Page
1. **Route**: Create `app/[locale]/admin/new-page/page.tsx`.
2. **Access**: Add `await requireAdmin()` at top of server component.
3. **Runtime**: Add `export const runtime = 'nodejs';`.
4. **Link**: Add navigation item in `AdminDashboardClient` or sidebar.

## 4. Verification Script
Run `node scripts/verify-admin-prod.js` locally to spot check health.
Requires `ADMIN_SESSION_TOKEN` (Supabase access token) in env.

```bash
# Example
export ADMIN_SESSION_TOKEN="eyJ..."
node scripts/verify-admin-prod.js
```

## 5. Manual Database Setup: Product Analytics Table

If the analytics tab shows "fallback mode" or errors, the `product_events` table may be missing. Run this SQL in Supabase SQL Editor:

### Step 1: Create Table

```sql
-- Create product_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.product_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NULL,
    event_name text NOT NULL,
    metadata jsonb NULL,
    created_at timestamptz DEFAULT now()
);
```

### Step 2: Create Indexes

```sql
-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_product_events_name_created 
    ON public.product_events(event_name, created_at);

CREATE INDEX IF NOT EXISTS idx_product_events_user_created 
    ON public.product_events(user_id, created_at);
```

### Step 3: Enable RLS

```sql
-- Enable RLS (service role bypasses this)
ALTER TABLE public.product_events ENABLE ROW LEVEL SECURITY;

-- No policies needed: service role has full access, regular users have no access
-- This effectively blocks all client-side access unless using service role
```

### Verification

After running the above SQL, verify in Supabase:
1. Go to **Table Editor** → Check `product_events` exists
2. Go to **Database** → **Indexes** → Verify `idx_product_events_*` exists
3. Visit `/admin` → **Analytics** tab → Should show real data (not fallback mode)

