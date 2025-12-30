-- Add gmap_link column to worker_transfers table
ALTER TABLE public.worker_transfers 
ADD COLUMN IF NOT EXISTS gmap_link text;