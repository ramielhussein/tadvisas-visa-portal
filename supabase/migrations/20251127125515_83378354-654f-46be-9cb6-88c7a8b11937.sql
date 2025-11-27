-- Allow super_admins to insert deals just like admins
ALTER POLICY "Admins can insert deals"
ON public.deals
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);
