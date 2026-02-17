
-- Manual Check for Expired Token Processing
-- 1. Create a token that expires in the past
INSERT INTO verification_tokens (
    user_id,
    contact_email,
    token_hash,
    action,
    expires_at,
    created_at
) VALUES (
    'YOUR_USER_ID',
    'expired@test.com',
    'hash_of_expired_token',
    'verify-status',
    NOW() - INTERVAL '1 MINUTE', -- Already expired
    NOW() - INTERVAL '2 DAYS'
);

-- 2. Ensure User has SCHEUDULED messages (mode=checkin)
-- (Verify via SELECT ...)

-- 3. Trigger Cron (via curl or browser)
-- GET /api/cron/process-expired-tokens

-- 4. Verify Results
-- Token should be marked used_at = now
SELECT * FROM verification_tokens WHERE contact_email = 'expired@test.com';

-- Events should be logged
SELECT * FROM confirmation_events WHERE contact_email = 'expired@test.com' AND decision IS NULL;
-- Expect: 
-- 1. type='token_expired', decision=NULL
-- 2. type='messages_released_auto', decision=NULL

-- Messages should be DELIVERED
SELECT * FROM messages WHERE owner_id = 'YOUR_USER_ID';
