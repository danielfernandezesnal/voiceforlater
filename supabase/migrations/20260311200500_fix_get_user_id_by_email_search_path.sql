-- Fix remaining warning: Function Search Path Mutable for get_user_id_by_email
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE p.proname = 'get_user_id_by_email' AND n.nspname = 'public') THEN
    EXECUTE 'ALTER FUNCTION public.get_user_id_by_email(text) SET search_path = ''''';
  END IF;
END $$;
