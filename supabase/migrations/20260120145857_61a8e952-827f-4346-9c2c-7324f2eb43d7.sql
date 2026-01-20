-- Add service_type column to payments table
ALTER TABLE public.payments 
ADD COLUMN service_type TEXT;

-- Add an index for better filtering performance
CREATE INDEX idx_payments_service_type ON public.payments(service_type);