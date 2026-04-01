-- ============================================================
-- TEST SEED: verify-status flow
-- Token:     test-token-123
-- SHA-256:   19b6b086eebb807f54e6327309dec0ff347a6c3c30bf3bb396f167513eba3475
-- Expires:   now() + 1 day
-- Created:   2026-03-24 (UTC)
--
-- Constraints:
--   - Does NOT modify any other table
--   - Does NOT trigger message release logic
--   - used_at remains NULL (token is fresh)
-- ============================================================

-- ── Step 1: Insert the test token ──────────────────────────
INSERT INTO public.verification_tokens (
    user_id,
    contact_email,
    token_hash,
    action,
    expires_at,
    created_at
)
SELECT
    sub.id                                                              AS user_id,
    'test-contact@example.com'                                          AS contact_email,
    '19b6b086eebb807f54e6327309dec0ff347a6c3c30bf3bb396f167513eba3475' AS token_hash,
    'verify-status'                                                     AS action,
    now() + INTERVAL '1 day'                                            AS expires_at,
    now()                                                               AS created_at
FROM (SELECT id FROM public.profiles LIMIT 1) sub
ON CONFLICT (token_hash) DO NOTHING;  -- Idempotent: safe to run multiple times


-- ── Step 2: Confirm the row exists and is unused ───────────
SELECT
    id,
    user_id,
    contact_email,
    token_hash,
    action,
    expires_at,
    used_at,
    created_at
FROM public.verification_tokens
WHERE token_hash = '19b6b086eebb807f54e6327309dec0ff347a6c3c30bf3bb396f167513eba3475';

-- Expected result:
--   id         → some UUID
--   token_hash → 19b6b086eebb807f54e6327309dec0ff347a6c3c30bf3bb396f167513eba3475
--   action     → verify-status
--   used_at    → NULL   ← confirms token is fresh
--   expires_at → ~24h from now
