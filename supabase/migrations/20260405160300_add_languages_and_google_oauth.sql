-- Actualizar constraint de locale para incluir los 4 idiomas
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_locale_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_locale_check 
CHECK (locale IN ('es', 'en', 'pt', 'fr'));

-- Function para auto-crear perfil cuando un usuario se registra con Google
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    locale,
    plan
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'locale', 'es'),
    'free'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que ejecuta la function cuando se crea un usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
