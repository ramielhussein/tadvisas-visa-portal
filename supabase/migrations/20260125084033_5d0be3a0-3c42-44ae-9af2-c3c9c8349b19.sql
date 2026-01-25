-- Allow sales users to view all deals for reports
CREATE POLICY "Sales users can view all deals for reports"
ON public.deals
FOR SELECT
USING (has_role(auth.uid(), 'sales'::app_role));

-- Allow sales managers to view all deals
CREATE POLICY "Sales managers can view all deals"
ON public.deals
FOR SELECT
USING (has_role(auth.uid(), 'sales_manager'::app_role));