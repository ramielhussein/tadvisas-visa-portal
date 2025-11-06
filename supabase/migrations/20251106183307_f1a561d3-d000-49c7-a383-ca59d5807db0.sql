-- Add policy to allow users with leads.assign permission to assign unassigned leads
CREATE POLICY "Users with assign permission can assign unassigned leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (
  assigned_to IS NULL 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.permissions->'leads'->>'assign')::boolean = true
  )
)
WITH CHECK (
  assigned_to IS NULL 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.permissions->'leads'->>'assign')::boolean = true
  )
);