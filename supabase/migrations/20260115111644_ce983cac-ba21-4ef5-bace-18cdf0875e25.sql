-- Allow sales users to view all leads (for duplicate checking and lead visibility)
CREATE POLICY "Sales users can view all leads"
ON public.leads
FOR SELECT
USING (
  public.has_role(auth.uid(), 'sales')
);