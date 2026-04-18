-- DROP FUNCTION si se precisan recrear dependencias estrictas, pero CREATE OR REPLACE actualiza de inmediato.
-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- Función para autocompletar el perfil en el registro
-- Soporta Magic Link ('first_name' / 'last_name') 
-- y Google OAuth con su formato ('given_name' / 'family_name' o parseando desde 'name' / 'full_name')
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
    COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'given_name',
      NULLIF(split_part(NEW.raw_user_meta_data->>'name', ' ', 1), ''),
      NULLIF(split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1), ''),
      ''
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'family_name',
      NULLIF(array_to_string((string_to_array(NEW.raw_user_meta_data->>'name', ' '))[2:], ' '), ''),
      NULLIF(array_to_string((string_to_array(NEW.raw_user_meta_data->>'full_name', ' '))[2:], ' '), ''),
      ''
    ),
    COALESCE(NEW.raw_user_meta_data->>'locale', 'es'),
    'free'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
