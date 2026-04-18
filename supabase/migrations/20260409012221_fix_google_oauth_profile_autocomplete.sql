-- DROP FUNCTION si se necesitara limpiar algo primero (idealmente CREATE OR REPLACE sobrescribe, pero dejamos el comentario solicitado)
-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- Función para autocompletar el perfil en el registro
-- Soporta información custom proveniente del flujo clásico de la aplicación (Magic Link) como 'first_name'/'last_name' 
-- y hace fallback natural al modelo de Google OAuth ('given_name'/'family_name').
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
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'given_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NEW.raw_user_meta_data->>'family_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'locale', 'es'),
    'free'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
