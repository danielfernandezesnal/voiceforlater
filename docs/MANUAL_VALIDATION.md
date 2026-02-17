
# Manual Validation Plan: Idempotency & Confirmation
Run these checks in SQL (Supabase Dashboard) or via a test script.

## 1. Verify Verification Tokens Table
```sql
SELECT * FROM verification_tokens ORDER BY created_at DESC;
```
**Expected:** 
- `action` = 'verify-status'
- `token_hash` is present (sha256)
- `used_at` is NULL initially

## 2. Verify Confirmation Events Table
```sql
SELECT * FROM confirmation_events ORDER BY created_at DESC;
```
**Expected:** Empty or contains prior test events.

## 3. Test Idempotency (Concurrent Simulation)
Since we can't easily simulate concurrency in SQL Editor, verify the code logic:
- `release-logic.ts` uses `UPDATE ... WHERE status='scheduled' ... SELECT`.
  - Only rows that matched 'scheduled' AND were updated are returned. 
  - If T1 runs, status becomes 'processing'.
  - If T2 runs concurrently, status is 'processing' (or locked row), so WHERE clause fails. T2 gets 0 rows.
  - **Result:** Only T1 sends emails.

## 4. Test Token One-Time Use
- `verify-status/route.ts` uses `UPDATE ... WHERE id=... AND used_at IS NULL`.
- If Request 1 updates it, `used_at` becomes set.
- Request 2 sees `used_at` IS NOT NULL (or update count 0).
- **Result:** Request 2 returns 409 Conflict.

## 5. Verify Message State Transition
Prerequisite: Have a message with `status='scheduled'`, `mode='checkin'`, `owner_id` (your test user).

**Run Release Logic (Simulated via helper or API):**
```sql
-- Check before
SELECT id, status FROM messages WHERE owner_id='USER_ID' AND status='scheduled';

-- (Trigger API via curl or UI)

-- Check after
SELECT id, status FROM messages WHERE owner_id='USER_ID';
```
**Expected:** Status changes to 'delivered' (or 'processing' -> 'delivered').

## 6. Verify "Deny" Logic
**Trigger Deny API:**
```bash
curl -X POST ... -d '{"decision": "deny"}'
```
**Expected:**
- `verification_tokens.decision` = 'deny'
- `checkins` table: `status`='active', `attempts`=0, `next_due_at` ~48h future.
- `messages` table: Status remains 'scheduled'.

## 7. Hardening Validation Results
- [x] Unique Index on `confirmation_events(token_id)` prevents double logging for same token.
- [x] Atomic UPDATE on `release-logic.ts` prevents double sending.
- [x] Optimistic Lock on `verify-status` prevents double token usage.
