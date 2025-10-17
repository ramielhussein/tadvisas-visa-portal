-- Allow anyone to submit applications (public form)
DROP POLICY IF EXISTS "Only admins can insert submissions" ON public.submissions;

CREATE POLICY "Anyone can submit applications" 
ON public.submissions 
FOR INSERT 
WITH CHECK (true);

-- Keep admin-only policies for viewing, updating, and deleting
-- (These were already created in previous migration)