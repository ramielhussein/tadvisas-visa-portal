-- Add transfer_category column for ADMIN/HR categorization
ALTER TABLE public.worker_transfers 
ADD COLUMN IF NOT EXISTS transfer_category text DEFAULT 'TRANSPORT';

-- Add hr_subtype for HR-specific sub-options
ALTER TABLE public.worker_transfers 
ADD COLUMN IF NOT EXISTS hr_subtype text;

-- Add admin_details for ADMIN transfer details
ALTER TABLE public.worker_transfers 
ADD COLUMN IF NOT EXISTS admin_details text;

-- Add location coordinates for map integration
ALTER TABLE public.worker_transfers 
ADD COLUMN IF NOT EXISTS from_lat numeric;

ALTER TABLE public.worker_transfers 
ADD COLUMN IF NOT EXISTS from_lng numeric;

ALTER TABLE public.worker_transfers 
ADD COLUMN IF NOT EXISTS to_lat numeric;

ALTER TABLE public.worker_transfers 
ADD COLUMN IF NOT EXISTS to_lng numeric;

-- Add comment explaining the categories
COMMENT ON COLUMN public.worker_transfers.transfer_category IS 'TRANSPORT (default), ADMIN, or HR';
COMMENT ON COLUMN public.worker_transfers.hr_subtype IS 'For HR category: ATTEND_MEDICAL, TAWJEEH, BIOMETRICS, PASSPORT_DELIVERY';