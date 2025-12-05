-- Remove the super_admin email restriction trigger and function
DROP TRIGGER IF EXISTS validate_super_admin_trigger ON public.user_roles;
DROP FUNCTION IF EXISTS public.validate_super_admin_role() CASCADE;