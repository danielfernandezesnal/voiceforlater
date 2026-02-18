-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT NOT NULL DEFAULT 'inactive', -- active, trialing, past_due, canceled, inactive
    current_period_end TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own subscription"
    ON public.user_subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role can insert/update (no public insert/update policy)

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON public.user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON public.user_subscriptions(stripe_subscription_id);

-- Migrate existing data from profiles (if any)
INSERT INTO public.user_subscriptions (user_id, plan, stripe_customer_id, stripe_subscription_id, status, current_period_end)
SELECT 
    id as user_id,
    COALESCE(plan, 'free'),
    stripe_customer_id,
    stripe_subscription_id,
    COALESCE(plan_status, 'inactive'),
    plan_ends_at
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
