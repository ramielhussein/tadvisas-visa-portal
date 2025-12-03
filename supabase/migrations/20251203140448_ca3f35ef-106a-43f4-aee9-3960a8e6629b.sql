-- Make worker_id nullable to allow transfer creation without a worker
ALTER TABLE public.worker_transfers ALTER COLUMN worker_id DROP NOT NULL;