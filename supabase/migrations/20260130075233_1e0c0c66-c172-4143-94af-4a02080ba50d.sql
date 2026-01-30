-- Allow Product team to view leads for linking workers to customers
CREATE POLICY "Product team can view leads for worker linking"
ON public.leads
FOR SELECT
USING (has_role(auth.uid(), 'product'::app_role));