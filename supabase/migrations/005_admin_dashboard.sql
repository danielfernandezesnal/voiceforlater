-- Admin Dashboard Schema
-- Migration 005: Add admin support, file size tracking, and email tracking

-- 1. Add is_admin column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = TRUE;

-- 2. Add file_size_bytes to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;

-- Create index for storage aggregation queries
CREATE INDEX IF NOT EXISTS idx_messages_file_size ON public.messages(owner_id, file_size_bytes) WHERE file_size_bytes IS NOT NULL;

-- 3. Create email_events table for tracking all emails sent
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  email_type TEXT NOT NULL, -- 'magic_link', 'checkin_reminder', 'message_delivery', 'trusted_contact_alert'
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for email_events
CREATE INDEX IF NOT EXISTS idx_email_events_user ON public.email_events(user_id);
CREATE INDEX IF NOT EXISTS idx_email_events_created ON public.email_events(created_at);
CREATE INDEX IF NOT EXISTS idx_email_events_status ON public.email_events(status);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON public.email_events(email_type);

-- RLS for email_events (admin-only table)
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- Admin can read all email events
CREATE POLICY "Admins can view all email events"
  ON public.email_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Service role can insert (for email tracking)
CREATE POLICY "Service role can insert email events"
  ON public.email_events FOR INSERT
  WITH CHECK (TRUE); -- Service role bypasses RLS anyway, but explicit policy for clarity

-- 4. Update RLS policies to allow admin read access to all tables

-- Admin can read all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.is_admin = TRUE
    )
  );

-- Admin can read all messages
CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.is_admin = TRUE
    )
  );

-- Admin can read all recipients
CREATE POLICY "Admins can view all recipients"
  ON public.recipients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.is_admin = TRUE
    )
  );

-- Admin can read all delivery_rules
CREATE POLICY "Admins can view all delivery_rules"
  ON public.delivery_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.is_admin = TRUE
    )
  );

-- Admin can read all trusted_contacts
CREATE POLICY "Admins can view all trusted_contacts"
  ON public.trusted_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.is_admin = TRUE
    )
  );

-- Admin can read all checkins
CREATE POLICY "Admins can view all checkins"
  ON public.checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.is_admin = TRUE
    )
  );

-- Admin can read all events
CREATE POLICY "Admins can view all events"
  ON public.events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.is_admin = TRUE
    )
  );

-- 5. Create helper function to get user email from auth.users
-- This is needed for admin dashboard to display user emails
CREATE OR REPLACE FUNCTION public.get_user_email(user_uuid UUID)
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Grant execute to authenticated users (will be used by admin API)
GRANT EXECUTE ON FUNCTION public.get_user_email TO authenticated;

-- 6. Create view for admin user statistics (optional, for easier querying)
CREATE OR REPLACE VIEW public.admin_user_stats AS
SELECT 
  p.id,
  (SELECT email FROM auth.users WHERE id = p.id) AS email,
  p.plan,
  p.stripe_customer_id,
  p.created_at,
  COALESCE(msg_counts.text_count, 0) AS text_messages,
  COALESCE(msg_counts.audio_count, 0) AS audio_messages,
  COALESCE(msg_counts.video_count, 0) AS video_messages,
  COALESCE(msg_counts.total_storage_bytes, 0) AS storage_bytes
FROM public.profiles p
LEFT JOIN (
  SELECT 
    owner_id,
    SUM(CASE WHEN type = 'text' THEN 1 ELSE 0 END) AS text_count,
    SUM(CASE WHEN type = 'audio' THEN 1 ELSE 0 END) AS audio_count,
    SUM(CASE WHEN type = 'video' THEN 1 ELSE 0 END) AS video_count,
    SUM(COALESCE(file_size_bytes, 0)) AS total_storage_bytes
  FROM public.messages
  GROUP BY owner_id
) msg_counts ON p.id = msg_counts.owner_id;

-- Grant select on view to authenticated (admin will use this)
GRANT SELECT ON public.admin_user_stats TO authenticated;

-- Note: To set a user as admin, run this SQL with the user's UUID:
-- UPDATE public.profiles SET is_admin = TRUE WHERE id = '<user-uuid>';
