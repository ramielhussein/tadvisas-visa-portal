-- Add deal_id column to refunds table to link refunds to deals
ALTER TABLE public.refunds 
ADD COLUMN IF NOT EXISTS deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_refunds_deal_id ON public.refunds(deal_id);