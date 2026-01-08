-- Add a policy to allow users to view profile names for workers they can see
CREATE POLICY "Users can view profile names for worker creators"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workers 
    WHERE workers.created_by = profiles.id
  )
);