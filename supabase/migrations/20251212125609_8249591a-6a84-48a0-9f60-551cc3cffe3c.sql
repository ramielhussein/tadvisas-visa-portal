
-- Allow driver managers to view driver profiles for task assignment
CREATE POLICY "Driver managers can view driver profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'driver_manager'
  )
  AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = profiles.id
    AND role = 'driver'
  )
);

-- Also allow users to view roles of drivers (needed to list drivers)
CREATE POLICY "Driver managers can view driver roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'driver_manager'
  )
  AND role = 'driver'
);
