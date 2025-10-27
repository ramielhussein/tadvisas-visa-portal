-- Update suppliers table to match new requirements
-- Make contact_person required
ALTER TABLE public.suppliers 
ALTER COLUMN contact_person SET NOT NULL;

-- Make phone required
ALTER TABLE public.suppliers 
ALTER COLUMN phone SET NOT NULL;

-- Add telephone field (required)
ALTER TABLE public.suppliers 
ADD COLUMN telephone text NOT NULL DEFAULT '';

-- Update payment_terms to match new options
-- First, update existing records to map to new values
UPDATE public.suppliers 
SET payment_terms = CASE 
  WHEN payment_terms LIKE '%30%' OR payment_terms LIKE '%60%' THEN 'Post Arrival'
  ELSE 'On Arrival'
END;

-- Add a check constraint for payment_terms
ALTER TABLE public.suppliers 
DROP CONSTRAINT IF EXISTS payment_terms_check;

ALTER TABLE public.suppliers 
ADD CONSTRAINT payment_terms_check 
CHECK (payment_terms IN ('Advance', 'On Arrival', 'Post Arrival'));