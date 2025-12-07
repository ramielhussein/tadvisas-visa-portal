-- Allow sales users to view workers that are available for deals
CREATE POLICY "Sales can view available workers for deals"
ON public.workers
FOR SELECT
USING (
  status IN ('Available', 'Approved', 'Reserved') 
  AND (
    has_role(auth.uid(), 'sales'::app_role) 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (((profiles.permissions -> 'deals'::text) ->> 'create'::text))::boolean = true
    )
  )
);