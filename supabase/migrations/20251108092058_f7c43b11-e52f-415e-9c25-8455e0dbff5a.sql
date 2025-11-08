-- Create a function to check if user is super admin (only rami@tadmaids.com)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = _user_id
      AND email = 'rami@tadmaids.com'
      AND EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = 'super_admin'
      )
  )
$$;

-- Create a trigger to prevent anyone except rami@tadmaids.com from getting super_admin role
CREATE OR REPLACE FUNCTION public.validate_super_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  IF NEW.role = 'super_admin' THEN
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = NEW.user_id;
    
    IF user_email != 'rami@tadmaids.com' THEN
      RAISE EXCEPTION 'Only rami@tadmaids.com can be assigned super_admin role';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS validate_super_admin_trigger ON public.user_roles;
CREATE TRIGGER validate_super_admin_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_super_admin_role();