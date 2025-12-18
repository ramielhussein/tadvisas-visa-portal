-- Allow users with refund.create permission to view all workers (for refund form worker selection)
CREATE POLICY "Users with refund permission can view workers" 
ON public.workers 
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