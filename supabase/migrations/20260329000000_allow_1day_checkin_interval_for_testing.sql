-- TESTING MIGRATION: allow 1-day check-in interval for QA / manual testing
-- This is intentionally temporary. To revert, restore the constraint to IN (30, 60, 90).

ALTER TABLE public.delivery_rules
  DROP CONSTRAINT IF EXISTS delivery_rules_checkin_interval_days_check;

ALTER TABLE public.delivery_rules
  ADD CONSTRAINT delivery_rules_checkin_interval_days_check
  CHECK (checkin_interval_days IN (1, 30, 60, 90));
