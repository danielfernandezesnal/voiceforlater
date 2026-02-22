-- 024_fix_user_roles_rls.sql
-- Allow users to view their own roles, fixing circular RLS issue and improving transparency

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_roles' 
        AND policyname = 'Users can view own role'
    ) THEN
        CREATE POLICY "Users can view own role" ON public.user_roles 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
END $$;
