-- Migration: Create delivery_tokens table
-- Reconstructed from production schema to resolve local drift

CREATE TABLE IF NOT EXISTS public.delivery_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.recipients(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.delivery_tokens ENABLE ROW LEVEL SECURITY;

-- Add confirmation policy
CREATE POLICY "Recipients can view delivery tokens of their messages"
ON public.delivery_tokens
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.messages m
        JOIN public.recipients r ON r.message_id = m.id
        WHERE m.id = delivery_tokens.message_id
          AND m.status = 'delivered'
          AND r.email = auth.jwt() ->> 'email'
    )
);
