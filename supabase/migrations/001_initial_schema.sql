-- VoiceForLater MVP - Initial Schema
-- Run this migration in Supabase SQL Editor or via CLI

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- MESSAGES
-- ============================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'audio')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'delivered')),
  text_content TEXT,
  audio_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own messages"
  ON public.messages FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================
-- RECIPIENTS
-- ============================================
CREATE TABLE public.recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL
);

-- RLS for recipients (via message ownership)
ALTER TABLE public.recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recipients of own messages"
  ON public.recipients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages 
      WHERE messages.id = recipients.message_id 
      AND messages.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert recipients to own messages"
  ON public.recipients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages 
      WHERE messages.id = recipients.message_id 
      AND messages.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update recipients of own messages"
  ON public.recipients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.messages 
      WHERE messages.id = recipients.message_id 
      AND messages.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete recipients of own messages"
  ON public.recipients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.messages 
      WHERE messages.id = recipients.message_id 
      AND messages.owner_id = auth.uid()
    )
  );

-- ============================================
-- DELIVERY RULES
-- ============================================
CREATE TABLE public.delivery_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL UNIQUE REFERENCES public.messages(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('date', 'checkin')),
  deliver_at TIMESTAMPTZ,
  checkin_interval_days INT CHECK (checkin_interval_days IN (30, 60, 90)),
  attempts_limit INT NOT NULL DEFAULT 3
);

-- RLS for delivery_rules (via message ownership)
ALTER TABLE public.delivery_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view delivery rules of own messages"
  ON public.delivery_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages 
      WHERE messages.id = delivery_rules.message_id 
      AND messages.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert delivery rules to own messages"
  ON public.delivery_rules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages 
      WHERE messages.id = delivery_rules.message_id 
      AND messages.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update delivery rules of own messages"
  ON public.delivery_rules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.messages 
      WHERE messages.id = delivery_rules.message_id 
      AND messages.owner_id = auth.uid()
    )
  );

-- ============================================
-- TRUSTED CONTACTS
-- ============================================
CREATE TABLE public.trusted_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  UNIQUE(user_id) -- One trusted contact per user for MVP
);

-- RLS for trusted_contacts
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trusted contacts"
  ON public.trusted_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trusted contacts"
  ON public.trusted_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trusted contacts"
  ON public.trusted_contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trusted contacts"
  ON public.trusted_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- CHECKINS
-- ============================================
CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_confirmed_at TIMESTAMPTZ,
  next_due_at TIMESTAMPTZ,
  attempts INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'confirmed_absent'))
);

-- RLS for checkins
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checkin"
  ON public.checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own checkin"
  ON public.checkins FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- EVENTS (logging)
-- ============================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for events (users can only view their own events)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON public.events FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- DELIVERY TOKENS (for secure message access)
-- ============================================
CREATE TABLE public.delivery_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.recipients(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No RLS - accessed via API routes with token validation
ALTER TABLE public.delivery_tokens ENABLE ROW LEVEL SECURITY;

-- Service role only (no user policies)

-- ============================================
-- FUNCTION: Create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX idx_messages_owner ON public.messages(owner_id);
CREATE INDEX idx_messages_status ON public.messages(status);
CREATE INDEX idx_recipients_message ON public.recipients(message_id);
CREATE INDEX idx_delivery_rules_message ON public.delivery_rules(message_id);
CREATE INDEX idx_checkins_next_due ON public.checkins(next_due_at);
CREATE INDEX idx_checkins_status ON public.checkins(status);
CREATE INDEX idx_delivery_tokens_token ON public.delivery_tokens(token);
CREATE INDEX idx_events_user ON public.events(user_id);
CREATE INDEX idx_events_type ON public.events(type);
