-- Add RLS policy for product team to view all workers
CREATE POLICY "Product team can view all workers"
ON public.workers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'product'));

-- Add RLS policy for product team to update workers
CREATE POLICY "Product team can update workers"
ON public.workers
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'product'));

-- Add RLS policy for product team to delete workers  
CREATE POLICY "Product team can delete workers"
ON public.workers
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'product'));