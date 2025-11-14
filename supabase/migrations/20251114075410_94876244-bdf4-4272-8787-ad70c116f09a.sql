-- Update the super admin validation function to allow rayaan@tadmaids.com as well
CREATE OR REPLACE FUNCTION public.validate_super_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_email text;
BEGIN
  IF NEW.role = 'super_admin' THEN
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = NEW.user_id;
    
    IF user_email NOT IN ('rami@tadmaids.com', 'rayaan@tadmaids.com') THEN
      RAISE EXCEPTION 'Only authorized users can be assigned super_admin role';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;