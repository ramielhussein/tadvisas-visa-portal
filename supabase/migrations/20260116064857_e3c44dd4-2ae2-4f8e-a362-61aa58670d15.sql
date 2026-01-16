-- Allow sales users to update all leads
CREATE POLICY "Sales users can update all leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'sales'::app_role))
WITH CHECK (has_role(auth.uid(), 'sales'::app_role));