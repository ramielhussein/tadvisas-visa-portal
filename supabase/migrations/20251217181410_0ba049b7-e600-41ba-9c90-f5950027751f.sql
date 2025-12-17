-- Add bumped_at column to leads table for "Bump to Top" feature
ALTER TABLE public.leads ADD COLUMN bumped_at timestamp with time zone DEFAULT NULL;

-- Create index for efficient sorting
CREATE INDEX idx_leads_bumped_at ON public.leads (bumped_at DESC NULLS LAST);