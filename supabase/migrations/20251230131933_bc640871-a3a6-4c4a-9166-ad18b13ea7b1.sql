-- Make to_location nullable since gmap_link can be used instead
ALTER TABLE public.worker_transfers ALTER COLUMN to_location DROP NOT NULL;