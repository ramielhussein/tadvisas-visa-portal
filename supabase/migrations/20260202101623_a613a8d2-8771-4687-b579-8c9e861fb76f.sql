
-- Allow sales users to view all refunds for reporting purposes
CREATE POLICY "Sales can view all refunds for reports"
ON public.refunds
FOR SELECT
USING (has_role(auth.uid(), 'sales'::app_role) OR has_role(auth.uid(), 'sales_manager'::app_role));
