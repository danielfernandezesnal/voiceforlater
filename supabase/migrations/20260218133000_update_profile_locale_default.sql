-- Update default locale to 'en'
ALTER TABLE public.profiles 
ALTER COLUMN locale SET DEFAULT 'en';

-- Backfill any nulls to 'en' (shouldn't be any due to previous NOT NULL)
UPDATE public.profiles SET locale = 'en' WHERE locale IS NULL;
