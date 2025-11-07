-- Add archived field to leads table
ALTER TABLE public.leads 
ADD COLUMN archived BOOLEAN DEFAULT false NOT NULL;

-- Create index for better performance on archived queries
CREATE INDEX idx_leads_archived ON public.leads(archived);

-- Add comment for clarity
COMMENT ON COLUMN public.leads.archived IS 'Marks leads as archived to hide from main view while preserving data';