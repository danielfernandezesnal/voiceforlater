-- Create RPC function to get user ID by email securely
-- This is used by the reset-password API route to avoid inefficient listUsers() calls

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email_to_find TEXT)
RETURNS UUID AS $$
DECLARE
  found_user_id UUID;
BEGIN
  -- Search in auth.users (requires security definer)
  SELECT id INTO found_user_id FROM auth.users WHERE email = email_to_find LIMIT 1;
  RETURN found_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
