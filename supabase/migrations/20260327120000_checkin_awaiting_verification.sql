-- Migration: Add awaiting_verification status to checkins + created_at to trusted_contacts
-- PR: feat/schema-checkin-awaiting-verification
--
-- 1. Extend checkins.status to include 'awaiting_verification'
--    This status sits between 'pending' (reminders sent) and 'confirmed_absent'
--    (all outreach complete). It represents the window where trusted contacts
--    are being reached out to sequentially.
--
-- 2. Add created_at to trusted_contacts for stable, ordered outreach.
--    Sequential trusted-contact notification requires a deterministic contact order.

-- Step 1: Replace inline status constraint with named, extended version
ALTER TABLE public.checkins
  DROP CONSTRAINT IF EXISTS checkins_status_check;

ALTER TABLE public.checkins
  ADD CONSTRAINT checkins_status_check
  CHECK (status IN ('active', 'pending', 'awaiting_verification', 'confirmed_absent'));

-- Step 2: Add created_at to trusted_contacts (safe if column already exists)
ALTER TABLE public.trusted_contacts
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
