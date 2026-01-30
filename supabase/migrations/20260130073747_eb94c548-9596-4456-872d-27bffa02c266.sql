-- Allow Product team to view deals for linking workers
CREATE POLICY "Product team can view deals for worker linking"
ON public.deals
FOR SELECT
USING (has_role(auth.uid(), 'product'::app_role));