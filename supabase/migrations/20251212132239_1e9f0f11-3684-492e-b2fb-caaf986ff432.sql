-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Driver managers can view driver roles" ON public.user_roles;

-- Create a security definer function to check driver manager role without recursion
CREATE OR REPLACE FUNCTION public.is_driver_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'driver_manager'::app_role
  )
$$;

-- Create a non-recursive policy for driver managers to view driver roles
CREATE POLICY "Driver managers can view driver roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  (public.is_driver_manager(auth.uid()) AND role = 'driver'::app_role)
  OR auth.uid() = user_id
);