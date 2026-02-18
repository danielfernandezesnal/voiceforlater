-- Create Audit Log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID, -- Nullable if action is checked before auth (e.g. rate limit, though we might not log that here)
    action TEXT NOT NULL,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Owner can read all (for future audit UI)
CREATE POLICY "Owners can view audit logs" ON public.admin_audit_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'owner'
        )
    );

-- Only Service Role can insert (via Admin Client)
-- No INSERT policy for authenticated users, effectively blocking them
-- Service role bypasses RLS
