# Admin Dashboard - Implementation Complete ✅

## 📋 Summary

Implemented a complete Admin Dashboard for VoiceForLater/CarryMyWords with:

- ✅ Secure admin authentication (admin@carrymywords.com → danielfernandezesnal@gmail.com)
- ✅ KPI dashboard with date filtering
- ✅ User management (list, search, edit, delete)
- ✅ Email tracking system
- ✅ File size tracking for storage metrics
- ✅ Server-side admin validation (RLS + API protection)
- ✅ No breaking changes to existing schema

---

## 🚀 DEPLOYMENT ACTIONS

### ACTION 1 — Supabase (Production) SQL

Run the migration file in Supabase SQL Editor:

**File**: `supabase/migrations/005_admin_dashboard.sql`

```sql
-- Copy and paste the entire contents of 005_admin_dashboard.sql
```

This migration adds:
- `profiles.is_admin` column
- `messages.file_size_bytes` column
- `email_events` table
- Admin RLS policies
- Helper functions and views

**Verify migration**:
```sql
-- Check admin column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'is_admin';

-- Check email_events table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'email_events';

-- Check file_size_bytes column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'messages' AND column_name = 'file_size_bytes';
```

### ACTION 2 — Set Admin User

**IMPORTANT**: Create the admin user FIRST before setting admin flag.

#### Step 2a: Create admin user (if doesn't exist)
1. Go to your app: `https://your-domain.com/es/auth/login`
2. Enter email: `admin@carrymywords.com`
3. Check `danielfernandezesnal@gmail.com` for the magic link
4. Click the link to create the account

#### Step 2b: Set admin flag
```bash
cd voiceforlater
node scripts/set-admin.js admin@carrymywords.com
```

**Expected output**:
```
✅ Found user: admin@carrymywords.com (ID: xxx-xxx-xxx)
✅ Successfully set admin@carrymywords.com as admin!
```

**Alternative (direct SQL)**:
```sql
-- Get the user ID
SELECT id, email FROM auth.users WHERE email = 'admin@carrymywords.com';

-- Set admin flag (replace 'USER-UUID-HERE' with actual UUID)
UPDATE public.profiles 
SET is_admin = TRUE 
WHERE id = 'USER-UUID-HERE';

-- Verify
SELECT id, email, plan, is_admin 
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'admin@carrymywords.com';
```

### ACTION 3 — Deploy to Vercel

No new environment variables needed! Deploy as normal:

```bash
git add .
git commit -m "feat: add admin dashboard with KPIs and user management"
git push
```

Vercel will automatically deploy.

### ACTION 4 — Verification Steps

#### Test 1: Admin Login Flow
1. Go to `https://your-domain.com/es/auth/login`
2. Enter: `admin@carrymywords.com`
3. **Verify**: Email is sent to `danielfernandezesnal@gmail.com` (NOT admin@carrymywords.com)
4. **Verify**: Email subject says "Acceso de administrador"
5. Click magic link
6. **Verify**: Successfully logged in

#### Test 2: Admin Dashboard Access
1. After logging in as admin, navigate to `/es/admin`
2. **Verify**: Dashboard loads (not redirected)
3. **Verify**: KPIs display:
   - Total Users
   - Paid Users
   - Storage Used (MB)
   - Emails Sent
4. **Verify**: User table loads with data

#### Test 3: Non-Admin Protection
1. Log out
2. Log in as a regular user (any other email)
3. Try to access `/es/admin`
4. **Verify**: Redirected to `/es/dashboard` (cannot access admin)

#### Test 4: KPI Filtering
1. As admin, in `/es/admin`
2. Set "From Date" and "To Date" filters
3. **Verify**: KPI numbers update based on date range
4. Click "Clear Dates"
5. **Verify**: Shows total stats again

#### Test 5: User Search
1. In users table, type an email in search box
2. **Verify**: Table filters to matching users
3. Clear search
4. **Verify**: All users displayed again

#### Test 6: Edit User Email
1. Click "Edit" on any user
2. Modal appears with current email
3. Change email to something new
4. Click "Save"
5. **Verify**: Success message
6. **Verify**: User email updated in table
7. **Verify**: User can log in with new email

#### Test 7: Delete User
1. Click "Delete" on a test user
2. **Verify**: Confirmation dialog appears
3. Confirm deletion
4. **Verify**: User removed from table
5. **Verify**: User cannot log in anymore
6. Check Supabase Storage
7. **Verify**: User's audio/video files deleted

#### Test 8: Email Tracking
1. Send a magic link email (login as any user)
2. As admin, check KPIs
3. **Verify**: "Emails Today" increments
4. Query `email_events` table:
```sql
SELECT * FROM public.email_events 
ORDER BY created_at DESC 
LIMIT 10;
```
5. **Verify**: New row with `email_type = 'magic_link'`

#### Test 9: File Size Tracking
1. As regular user, create a new audio or video message
2. As admin, check user's storage in admin dashboard
3. **Verify**: Storage MB shows non-zero value
4. Query directly:
```sql
SELECT id, owner_id, type, file_size_bytes 
FROM messages 
WHERE file_size_bytes IS NOT NULL 
LIMIT 5;
```
5. **Verify**: `file_size_bytes` populated for new messages

#### Test 10: Pagination
1. In admin dashboard, if you have >25 users
2. **Verify**: "Next" button enabled
3. Click "Next"
4. **Verify**: Shows users 26-50
5. **Verify**: "Previous" button enabled
6. Click "Previous"
7. **Verify**: Back to users 1-25

---

## 📊 Database Queries for Verification

### Check Admin Status
```sql
SELECT 
  u.email,
  p.plan,
  p.is_admin,
  p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.is_admin = TRUE;
```

### Check Email Events
```sql
SELECT 
  email_type,
  status,
  COUNT(*) as count
FROM email_events
GROUP BY email_type, status
ORDER BY email_type, status;
```

### Check Storage Usage
```sql
SELECT 
  u.email,
  SUM(COALESCE(m.file_size_bytes, 0)) / 1024.0 / 1024.0 as storage_mb,
  COUNT(*) as message_count
FROM profiles p
JOIN auth.users u ON p.id = u.id
LEFT JOIN messages m ON m.owner_id = p.id
GROUP BY u.email
ORDER BY storage_mb DESC
LIMIT 10;
```

### Check Recent Users
```sql
SELECT 
  u.email,
  p.plan,
  p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC
LIMIT 10;
```

---

## 🔐 Security Verification

### Test RLS Policies
```sql
-- As regular user (should return only own data)
SET request.jwt.claims.sub = 'regular-user-uuid';
SELECT * FROM profiles; -- Should see only 1 row

-- As admin (should return all data)
SET request.jwt.claims.sub = 'admin-user-uuid';
SELECT * FROM profiles; -- Should see all rows
```

### API Endpoint Protection
Test these endpoints **without** admin session (should return 403):
```bash
curl https://your-domain.com/api/admin/kpis
curl https://your-domain.com/api/admin/users
```

Expected response:
```json
{"error": "Unauthorized"}
```

Test **with** admin session (via browser logged in as admin):
```bash
# Should return data
fetch('/api/admin/kpis').then(r => r.json()).then(console.log)
```

---

## 📁 Files Changed

### New Files
1. `supabase/migrations/005_admin_dashboard.sql` - Database migration
2. `lib/admin.ts` - Admin utilities
3. `lib/email-tracking.ts` - Email tracking utilities
4. `app/api/admin/kpis/route.ts` - KPIs API
5. `app/api/admin/users/route.ts` - Users list API
6. `app/api/admin/users/[id]/route.ts` - Delete user API
7. `app/api/admin/users/email/route.ts` - Edit email API
8. `app/[locale]/admin/layout.tsx` - Admin layout (protected)
9. `app/[locale]/admin/page.tsx` - Admin page
10. `app/[locale]/admin/admin-dashboard-client.tsx` - Admin UI
11. `scripts/set-admin.js` - Set admin script

### Modified Files
1. `app/api/auth/magic-link/route.ts` - Admin login redirect + email tracking
2. `app/api/messages/route.ts` - File size tracking (POST + PUT)

---

## 🎯 Feature Checklist

- ✅ Admin login redirects `admin@carrymywords.com` → `danielfernandezesnal@gmail.com`
- ✅ Magic link email shows "Admin Access" banner
- ✅ Admin dashboard protected at `/[locale]/admin`
- ✅ Server-side admin validation (not client-only)
- ✅ KPIs: Total users, Paid users, Storage, Emails sent
- ✅ KPI date range filtering
- ✅ User listing with pagination (25 per page)
- ✅ Search users by email
- ✅ Message counts per user (text/audio/video)
- ✅ Storage per user (MB)
- ✅ Edit user email
- ✅ Delete user (with storage cleanup)
- ✅ Email tracking in `email_events` table
- ✅ File size tracking in `file_size_bytes`
- ✅ RLS policies for admin access
- ✅ No breaking schema changes
- ✅ Existing app functionality unchanged

---

## 🔧 Troubleshooting

### Issue: Admin flag not working
**Solution**:
```sql
-- Re-run set admin
UPDATE profiles SET is_admin = TRUE WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@carrymywords.com'
);
```

### Issue: Cannot access /admin page
**Checklist**:
1. Is user logged in?
2. Is `is_admin` set to TRUE in database?
3. Check browser console for errors
4. Try logging out and back in

### Issue: Email tracking not working
**Check**:
```sql
SELECT COUNT(*) FROM email_events;
```
If 0, emails aren't being tracked. Check:
1. Migration 005 ran successfully
2. `lib/email-tracking.ts` is being imported
3. Check server logs for tracking errors

### Issue: Storage shows 0 MB for all users
**Solution**: File sizes are only tracked for NEW uploads after migration.
To backfill (optional):
```sql
-- List messages without file_size_bytes
SELECT id, audio_path FROM messages 
WHERE audio_path IS NOT NULL 
AND file_size_bytes IS NULL;
```
Note: Backfilling requires fetching file metadata from Supabase Storage (not implemented in this version, as per "minimal changes" requirement).

---

## 📞 Support

If issues arise:
1. Check Supabase logs
2. Check Vercel function logs
3. Check browser console for client errors
4. Verify migration ran completely
5. Verify admin flag is set correctly
6. Test with a fresh incognito session

---

**Implementation Date**: February 8, 2026  
**Status**: ✅ COMPLETE - Ready for deployment
