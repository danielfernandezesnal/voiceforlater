-- VoiceForLater - Stripe Integration Migration
-- Adds additional fields for subscription management
-- Run this migration in Supabase SQL Editor

-- Add plan_status and plan_ends_at columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS plan_ends_at TIMESTAMPTZ;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
ON public.profiles(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

-- Add policy for service role to update profiles (for webhooks)
-- Note: Service role bypasses RLS, so this is just documentation
COMMENT ON TABLE public.profiles IS 'User profiles with subscription info. Service role can update all rows for webhook handling.';
