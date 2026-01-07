-- Add deal_only column to leads table for leads that should not appear in incoming queue
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS deal_only boolean DEFAULT false;

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_leads_deal_only ON public.leads(deal_only) WHERE deal_only = true;

-- Add comment for documentation
COMMENT ON COLUMN public.leads.deal_only IS 'When true, this lead is hidden from incoming leads queue and only used for creating deals';