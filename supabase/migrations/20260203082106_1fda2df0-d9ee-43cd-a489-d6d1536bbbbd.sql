-- Allow anonymous users to insert leads via public forms
CREATE POLICY "Public can insert leads via forms"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (true);

-- Create a comment to track the purpose
COMMENT ON POLICY "Public can insert leads via forms" ON public.leads IS 'Allows anonymous visitors to submit leads via public landing page forms';