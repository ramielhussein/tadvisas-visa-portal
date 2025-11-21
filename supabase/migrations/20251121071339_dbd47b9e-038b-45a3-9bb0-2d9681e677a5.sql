-- Add staff column to workers table
ALTER TABLE public.workers 
ADD COLUMN IF NOT EXISTS staff boolean NOT NULL DEFAULT false;

-- Add comment explaining the field
COMMENT ON COLUMN public.workers.staff IS 'If true, this CV is for internal staff only and should not be visible to public';