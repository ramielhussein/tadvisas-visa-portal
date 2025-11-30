-- Add color field to leads table for visual identification
ALTER TABLE public.leads 
ADD COLUMN color TEXT DEFAULT NULL;

COMMENT ON COLUMN public.leads.color IS 'Visual identifier color for lead cards in kanban view';