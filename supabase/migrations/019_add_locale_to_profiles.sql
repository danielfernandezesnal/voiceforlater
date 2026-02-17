-- Add locale to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'es';

-- Update handle_new_user to persist locale from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, locale)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'locale', 'es')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
