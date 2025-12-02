-- Add 'driver' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'driver';

-- Add driver-specific columns to worker_transfers
ALTER TABLE public.worker_transfers
ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS driver_status text DEFAULT 'pending' CHECK (driver_status IN ('pending', 'accepted', 'pickup', 'in_transit', 'delivered', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS accepted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS pickup_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS proof_photo_url text,
ADD COLUMN IF NOT EXISTS signature_url text,
ADD COLUMN IF NOT EXISTS transfer_time text;

-- Update the status column to use driver_status as default value sync
UPDATE public.worker_transfers SET driver_status = 'pending' WHERE driver_status IS NULL;

-- Create index for driver queries
CREATE INDEX IF NOT EXISTS idx_worker_transfers_driver_id ON public.worker_transfers(driver_id);
CREATE INDEX IF NOT EXISTS idx_worker_transfers_driver_status ON public.worker_transfers(driver_status);

-- Create storage bucket for task proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('tadgo-proofs', 'tadgo-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for tadgo proofs - drivers can upload
CREATE POLICY "Drivers can upload proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tadgo-proofs' AND auth.role() = 'authenticated');

-- Storage policy - public read for proofs
CREATE POLICY "Public read for tadgo proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'tadgo-proofs');

-- RLS policy for drivers to view available tasks (unassigned)
CREATE POLICY "Drivers can view available tasks"
ON public.worker_transfers FOR SELECT
TO authenticated
USING (
  driver_id IS NULL 
  OR driver_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'product')
);

-- RLS policy for drivers to accept/update their tasks
CREATE POLICY "Drivers can update their tasks"
ON public.worker_transfers FOR UPDATE
TO authenticated
USING (
  driver_id = auth.uid()
  OR driver_id IS NULL
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'product')
)
WITH CHECK (
  driver_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'product')
);

-- Enable realtime for worker_transfers
ALTER PUBLICATION supabase_realtime ADD TABLE public.worker_transfers;