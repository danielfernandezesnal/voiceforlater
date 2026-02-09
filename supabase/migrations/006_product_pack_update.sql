-- 1. Updates to PROFILES table
-- Add checkin_interval_days
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS checkin_interval_days INTEGER DEFAULT 30;

-- Add auth_password_set flag
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS auth_password_set BOOLEAN DEFAULT FALSE;

-- 2. Ensure Trusted Contacts constraints
-- Make sure email is unique per user (if not already)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'trusted_contacts_user_id_email_key'
    ) THEN
        ALTER TABLE public.trusted_contacts 
        ADD CONSTRAINT trusted_contacts_user_id_email_key UNIQUE (user_id, email);
    END IF;
END $$;

-- 3. Create MESSAGE_TRUSTED_CONTACTS table (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.message_trusted_contacts (
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    trusted_contact_id UUID NOT NULL REFERENCES public.trusted_contacts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (message_id, trusted_contact_id)
);

-- 4. Enable RLS on new table
ALTER TABLE public.message_trusted_contacts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for message_trusted_contacts
-- Allow users to view/manage contacts for their own messages
DROP POLICY IF EXISTS "Users can manage their message recipients" ON public.message_trusted_contacts;

CREATE POLICY "Users can manage their message recipients"
ON public.message_trusted_contacts
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.messages m
        WHERE m.id = message_trusted_contacts.message_id
        AND m.owner_id = auth.uid()
    )
);

-- Admin policy (using the secure function we created earlier)
CREATE POLICY "Admins can manage all message recipients"
ON public.message_trusted_contacts
FOR ALL
USING ( public.check_if_admin() IS TRUE );


-- 6. DATA MIGRATION: Link existing contacts to existing messages
-- Logic: For every message, assign ALL of the user's current trusted contacts.
-- This preserves existing behavior where trusted contacts applied globally.
INSERT INTO public.message_trusted_contacts (message_id, trusted_contact_id)
SELECT m.id, tc.id
FROM public.messages m
JOIN public.trusted_contacts tc ON m.owner_id = tc.user_id
ON CONFLICT (message_id, trusted_contact_id) DO NOTHING;

-- 7. Update checkin interval migration (map 30/60/90 if they exist in another form, 
-- but currently they seem to be defaults or logic-based. We just set default 30 for now).
-- If there was a previous setting column, we would migrate it here.
