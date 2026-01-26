-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Authenticated users can create deals" ON public.deals;

-- Create a more flexible insert policy that allows authenticated users to create deals
-- The assigned_to field can be any valid user, not just the current user
CREATE POLICY "Authenticated users can create deals"
ON public.deals
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);