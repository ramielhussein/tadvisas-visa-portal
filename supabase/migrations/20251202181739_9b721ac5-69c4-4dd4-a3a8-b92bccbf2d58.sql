-- Add driver location columns to worker_transfers for tracking
ALTER TABLE public.worker_transfers 
ADD COLUMN IF NOT EXISTS driver_lat numeric;

ALTER TABLE public.worker_transfers 
ADD COLUMN IF NOT EXISTS driver_lng numeric;

ALTER TABLE public.worker_transfers 
ADD COLUMN IF NOT EXISTS driver_location_updated_at timestamp with time zone;