-- Add abscond classification and claim tracking to refunds table
ALTER TABLE public.refunds 
ADD COLUMN IF NOT EXISTS abscond_classification text CHECK (abscond_classification IN ('NON_INSURED', 'INSURED', 'AGENT_COVERED')),
ADD COLUMN IF NOT EXISTS claim_status text DEFAULT 'pending' CHECK (claim_status IN ('pending', 'submitted', 'approved', 'rejected', 'paid')),
ADD COLUMN IF NOT EXISTS claim_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS claim_submitted_date date,
ADD COLUMN IF NOT EXISTS claim_paid_date date,
ADD COLUMN IF NOT EXISTS claim_reference text,
ADD COLUMN IF NOT EXISTS claim_notes text,
ADD COLUMN IF NOT EXISTS insurance_provider text,
ADD COLUMN IF NOT EXISTS agent_supplier_id uuid REFERENCES public.suppliers(id);

-- Add index for abscond queries
CREATE INDEX IF NOT EXISTS idx_refunds_abscond_classification ON public.refunds(abscond_classification) WHERE abscond_classification IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.refunds.abscond_classification IS 'Classification of abscond loss: NON_INSURED (company loss), INSURED (insurance claim), AGENT_COVERED (agent/supplier claim)';