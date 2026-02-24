-- Remove UNIQUE constraint on user_id to allow multiple trusted contacts per user
ALTER TABLE public.trusted_contacts DROP CONSTRAINT IF EXISTS trusted_contacts_user_id_key;

-- Add UNIQUE constraint on (user_id, email) to prevent duplicate contacts for same person
ALTER TABLE public.trusted_contacts ADD CONSTRAINT trusted_contacts_user_id_email_key UNIQUE (user_id, email);
