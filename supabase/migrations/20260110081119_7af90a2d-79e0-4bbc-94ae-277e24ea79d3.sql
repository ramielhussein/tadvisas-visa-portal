-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create activities for their leads" ON public.lead_activities;

-- Create a new INSERT policy that allows:
-- 1. Users assigned to the lead
-- 2. Users with 'sales' role
-- 3. Users with 'admin' role
CREATE POLICY "Sales and admins can create lead activities"
ON public.lead_activities
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = lead_id
    AND (
      leads.assigned_to = auth.uid()
      OR public.has_role(auth.uid(), 'sales')
      OR public.has_role(auth.uid(), 'admin')
    )
  )
);