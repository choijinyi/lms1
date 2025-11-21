-- Migration: Handle new user trigger
-- Automatically creates a profile entry when a new user signs up via Supabase Auth

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_metadata->>'role', 'learner'), -- Default to learner if not specified
    COALESCE(NEW.raw_user_metadata->>'name', split_part(NEW.email, '@', 1)), -- Fallback to email username
    COALESCE(NEW.raw_user_metadata->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
