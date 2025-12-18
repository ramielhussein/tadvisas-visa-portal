-- Allow users with refund.create permission to view all submissions (for refund form client selection)
CREATE POLICY "Users with refund permission can view all submissions" 
ON public.submissions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      (profiles.permissions -> 'refund' ->> 'create')::boolean = true
    )
  )
);