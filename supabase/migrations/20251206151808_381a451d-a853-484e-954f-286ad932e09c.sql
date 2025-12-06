-- Add date tracking and reminder configuration to deals table
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS reminder_days_before integer DEFAULT 3;

-- Add comment for clarity
COMMENT ON COLUMN public.deals.reminder_days_before IS 'Days before end_date to trigger payment reminder. Default 3 for P4 Monthly, use 30 for P5.';

-- Create index for efficient reminder queries
CREATE INDEX IF NOT EXISTS idx_deals_end_date ON public.deals(end_date);
CREATE INDEX IF NOT EXISTS idx_deals_start_date ON public.deals(start_date);