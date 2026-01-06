
-- Add deal_date column to store the business date of the deal (separate from created_at which is system timestamp)
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS deal_date DATE;

-- Populate deal_date from created_at for existing records (since created_at was incorrectly storing deal date)
UPDATE public.deals SET deal_date = DATE(created_at) WHERE deal_date IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.deals.deal_date IS 'The business date when the deal happened (user-selected)';
COMMENT ON COLUMN public.deals.created_at IS 'System timestamp when the record was created';
