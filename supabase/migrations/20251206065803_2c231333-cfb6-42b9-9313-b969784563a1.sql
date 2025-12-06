-- Add title column to worker_transfers for quick task identification
ALTER TABLE public.worker_transfers 
ADD COLUMN IF NOT EXISTS title TEXT;