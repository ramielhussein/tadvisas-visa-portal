-- Add attachments column to deals table
ALTER TABLE public.deals
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.deals.attachments IS 'Array of attachment objects with name, url, uploaded_at, uploaded_by';