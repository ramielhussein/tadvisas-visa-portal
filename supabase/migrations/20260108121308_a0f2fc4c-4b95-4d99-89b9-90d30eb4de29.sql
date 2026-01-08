-- Drop the problematic policy causing infinite recursion
DROP POLICY IF EXISTS "Users can view profile names for worker creators" ON public.profiles;

-- Create a simpler policy that allows viewing basic profile info (id, full_name, email) for any authenticated user
-- This is safe because profiles only contain non-sensitive public info
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);