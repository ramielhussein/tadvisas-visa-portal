-- Add created_by field to workers table
ALTER TABLE public.workers
ADD COLUMN created_by uuid REFERENCES auth.users(id);

-- Add index for better query performance
CREATE INDEX idx_workers_created_by ON public.workers(created_by);

-- Update RLS policy to allow users with cv.create permission to insert workers
CREATE POLICY "Users with cv.create permission can insert workers"
ON public.workers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (permissions->'cv'->>'create')::boolean = true
  )
);