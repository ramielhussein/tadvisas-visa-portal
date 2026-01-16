-- Allow sales_manager users to view all leads
CREATE POLICY "Sales managers can view all leads"
ON public.leads
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'sales_manager'::app_role));

-- Allow sales_manager users to update all leads
CREATE POLICY "Sales managers can update all leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'sales_manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'sales_manager'::app_role));