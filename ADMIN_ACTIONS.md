# ADMIN DASHBOARD - PASTE-READY ACTION LIST

## 📋 Quick Deployment Checklist

Follow these actions in order for production deployment.

---

## ACTION 1 — Supabase (Production) SQL Migration

**Where**: Supabase Dashboard → SQL Editor  
**File**: `supabase/migrations/005_admin_dashboard.sql`

### Steps:
1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your **VoiceForLater** project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Open the file `voiceforlater/supabase/migrations/005_admin_dashboard.sql`
6. Copy **entire contents** of the file
7. Paste into Supabase SQL Editor
8. Click **Run** (bottom right)
9. Wait for success message: "Success. No rows returned"

### Verify Migration:
Run this query in SQL Editor:
```sql
-- Should return 3 rows
SELECT column_name FROM information_schema.columns 
WHERE (table_name = 'profiles' AND column_name = 'is_admin')
   OR (table_name = 'messages' AND column_name = 'file_size_bytes')
   OR (table_name = 'email_events' AND column_name = 'id');
```

**Expected**: 3 rows returned  
**If 0 rows**: Migration didn't run - check for SQL errors

---

## ACTION 2 — Create and Set Admin User

### Step 2a: Create the admin user account

**IMPORTANT**: Do this BEFORE setting the admin flag.

1. Open your production app: `https://your-domain.com/es/auth/login`
2. Enter email: `admin@carrymywords.com`
3. Click "Enviar enlace"
4. **Check email**: `danielfernandezesnal@gmail.com` (NOT admin@carrymywords.com!)
5. Open email with subject "Acceso de administrador - VoiceForLater"
6. Click the magic link button
7. You'll be redirected and logged in

### Step 2b: Set the admin flag

**Option A: Using the script (recommended)**
```bash
cd voiceforlater
node scripts/set-admin.js admin@carrymywords.com
```

**Expected output**:
```
✅ Found user: admin@carrymywords.com (ID: xxx)
✅ Successfully set admin@carrymywords.com as admin!
```

**Option B: Using SQL directly**
```sql
-- Get the user ID
SELECT id, email FROM auth.users WHERE email = 'admin@carrymywords.com';

-- Copy the UUID from the result above, then:
UPDATE public.profiles 
SET is_admin = TRUE 
WHERE id = 'PASTE-UUID-HERE';

-- Verify it worked
SELECT p.is_admin, u.email 
FROM profiles p 
JOIN auth.users u ON p.id = u.id 
WHERE u.email = 'admin@carrymywords.com';
```

**Expected**: `is_admin = true` in the result

---

## ACTION 3 — Deploy to Vercel

No new environment variables needed!

```bash
# From voiceforlater directory
git status
git add .
git commit -m "feat: add admin dashboard with KPIs and user management

- Admin login redirects admin@carrymywords.com to danielfernandezesnal@gmail.com
- Added KPIs: users, paid users, storage, emails sent
- User management: list, search, edit email, delete
- Email tracking system (email_events table)
- File size tracking for storage metrics
- Server-protected admin routes with RLS policies
- Migration 005: profiles.is_admin, messages.file_size_bytes, email_events table"

git push
```

**Vercel will auto-deploy** from GitHub.

### Monitor deployment:
1. Go to https://vercel.com/dashboard
2. Watch deployment log
3. Wait for "Deployment Ready" ✅

---

## ACTION 4 — Verification (Production)

### Test 1: Admin Login Flow ✅
1. Open incognito window
2. Go to `https://your-domain.com/es/auth/login`
3. Enter: `admin@carrymywords.com`
4. Click "Enviar enlace"
5. **✅ Verify**: Email arrives at `danielfernandezesnal@gmail.com`
6. **✅ Verify**: Email subject is "Acceso de administrador"
7. **✅ Verify**: Email has yellow banner saying "Acceso de administrador"
8. Click magic link
9. **✅ Verify**: Successfully logged in

### Test 2: Admin Dashboard Access ✅
1. After logged in as admin, go to `/es/admin`
2. **✅ Verify**: Dashboard loads (not redirected away)
3. **✅ Verify**: 4 KPI cards visible:
   - Total Users (shows count)
   - Paid Users (shows count)
   - Storage Used (shows MB)
   - Emails Sent (shows count)
4. **✅ Verify**: User table visible below KPIs
5. **✅ Verify**: Table shows columns: #, Email, Pro?, Text, Audio, Video, Storage, Actions

### Test 3: Non-Admin Cannot Access ✅
1. Log out
2. Log in with a different email (regular user)
3. Try to access `/es/admin`
4. **✅ Verify**: Redirected to `/es/dashboard`
5. **✅ Verify**: Cannot see admin content

### Test 4: KPI Date Filtering ✅
1. As admin in `/es/admin`
2. Set "From Date" to 1 week ago
3. Set "To Date" to today
4. **✅ Verify**: KPI numbers update
5. Click "Clear Dates"
6. **✅ Verify**: Numbers return to totals

### Test 5: User Search ✅
1. In search box, type part of an email
2. **✅ Verify**: Table filters to matching users only
3. Clear search
4. **✅ Verify**: All users shown again

### Test 6: Edit User Email ✅
1. Click "Edit" on any user
2. **✅ Verify**: Modal appears
3. Change email to `test-new@example.com`
4. Click "Save"
5. **✅ Verify**: Success alert
6. **✅ Verify**: Email changed in table
7. Try logging in with new email
8. **✅ Verify**: Login works with new email

### Test 7: Delete User ✅
1. Create a test user first (login as test123@example.com)
2. As admin, find that user in the table
3. Click "Delete"
4. **✅ Verify**: Confirmation dialog appears
5. Confirm deletion
6. **✅ Verify**: User removed from table
7. Try logging in as that user
8. **✅ Verify**: Cannot log in (user deleted from auth)

### Test 8: Email Tracking Verification ✅
```sql
-- Run in Supabase SQL Editor
SELECT 
  email_type,
  status,
  COUNT(*) as count
FROM email_events
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY email_type, status;
```
**✅ Verify**: See rows with `email_type = 'magic_link'` and `status = 'sent'`

### Test 9: File Size Tracking ✅
1. As regular user, create a new audio message
2. Upload a short audio file
3. Save the message
4. As admin, go to `/es/admin`
5. Find that user in the table
6. **✅ Verify**: Storage (MB) column shows >0 for that user

### Test 10: Pagination ✅
(Only if you have >25 users)
1. In admin dashboard
2. **✅ Verify**: "Next" button enabled
3. Click "Next"
4. **✅ Verify**: Shows page 2
5. **✅ Verify**: "Previous" button now enabled

---

## 🔍 SQL Health Checks

Run these in Supabase SQL Editor to verify everything:

### Check Admin User
```sql
SELECT 
  u.email,
  p.is_admin,
  p.plan
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.is_admin = TRUE;
```
**Expected**: 1 row with `admin@carrymywords.com`

### Check Email Events Table
```sql
SELECT COUNT(*) as total_emails FROM email_events;
```
**Expected**: Non-zero number (emails being tracked)

### Check File Sizes
```sql
SELECT 
  COUNT(*) as messages_with_size,
  SUM(file_size_bytes) / 1024.0 / 1024.0 as total_mb
FROM messages
WHERE file_size_bytes IS NOT NULL;
```
**Expected**: Shows how many messages have file size data

### Check User Stats
```sql
SELECT * FROM admin_user_stats LIMIT 5;
```
**Expected**: Returns user rows with email, message counts, storage

---

## ⚠️ Rollback Plan (If Needed)

If something goes wrong:

### Rollback Migration
```sql
-- Remove admin column
ALTER TABLE profiles DROP COLUMN IF EXISTS is_admin;

-- Remove file size column
ALTER TABLE messages DROP COLUMN IF EXISTS file_size_bytes;

-- Drop email events table
DROP TABLE IF EXISTS email_events;

-- Drop admin view
DROP VIEW IF EXISTS admin_user_stats;

-- Drop admin policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
-- ... (repeat for other admin policies)
```

### Redeploy Previous Version
```bash
git revert HEAD
git push
```

---

## ✅ Success Criteria

All checks must pass:

- ✅ Migration ran without errors
- ✅ Admin user created (`admin@carrymywords.com`)
- ✅ Admin flag set (`is_admin = TRUE`)
- ✅ Admin can access `/es/admin`
- ✅ Non-admin CANNOT access `/es/admin`
- ✅ KPIs display correctly
- ✅ User table loads with data
- ✅ Edit email works
- ✅ Delete user works
- ✅ Email tracking increments (check `email_events`)
- ✅ File sizes tracked for new uploads

---

## 📊 Post-Deployment Monitoring

### Week 1 Checks
- Monitor email_events table growth
- Check admin dashboard loads without errors
- Verify storage metrics are accurate
- Ensure KPIs match manual counts

### SQL to run weekly:
```sql
-- Email tracking health
SELECT 
  DATE(created_at) as date,
  email_type,
  COUNT(*) as count
FROM email_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY date, email_type
ORDER BY date DESC;

-- Storage growth
SELECT 
  SUM(file_size_bytes) / 1024.0 / 1024.0 as total_mb
FROM messages;

-- User growth
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_users,
  SUM(CASE WHEN plan = 'pro' THEN 1 ELSE 0 END) as pro_users
FROM profiles
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC;
```

---

**Deployment Complete When**: All ✅ checks pass  
**Expected Duration**: 15-20 minutes total  
**Last Updated**: February 8, 2026
