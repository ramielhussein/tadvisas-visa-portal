-- Remove public CV submission policy
DROP POLICY IF EXISTS "Anyone can submit worker CVs" ON public.workers;

-- Add authenticated-only CV submission policy
CREATE POLICY "Authenticated users can submit worker CVs"
ON public.workers
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Ensure only authenticated users can submit applications
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.submissions;

CREATE POLICY "Authenticated users can submit applications"
ON public.submissions
FOR INSERT
TO authenticated
WITH CHECK (true);