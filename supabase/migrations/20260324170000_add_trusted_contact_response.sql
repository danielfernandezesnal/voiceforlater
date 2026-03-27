-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Trusted Contact Response Storage
-- Adds structured response columns to verification_tokens
-- so we can capture what the trusted contact reported.
--
-- NOTE: This does NOT trigger message release logic.
-- The actual delivery decision belongs to a separate step.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Add contact_status to capture the selected response
--    Values: alive | critical | deceased | unknown
ALTER TABLE public.verification_tokens
  ADD COLUMN IF NOT EXISTS contact_status TEXT
    CHECK (contact_status IN ('alive', 'critical', 'deceased', 'unknown'));

-- 2. Add optional free-text comment from the trusted contact
ALTER TABLE public.verification_tokens
  ADD COLUMN IF NOT EXISTS contact_comment TEXT;

-- 3. Add responded_at timestamp (separate from used_at for clarity)
ALTER TABLE public.verification_tokens
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- 4. Also store the status in confirmation_events for audit trail
--    (The 'type' column already captures the event type)
ALTER TABLE public.confirmation_events
  ADD COLUMN IF NOT EXISTS contact_status TEXT
    CHECK (contact_status IN ('alive', 'critical', 'deceased', 'unknown'));

ALTER TABLE public.confirmation_events
  ADD COLUMN IF NOT EXISTS contact_comment TEXT;

-- 5. Reload schema cache
NOTIFY pgrst, 'reload schema';
