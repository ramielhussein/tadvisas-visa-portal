-- Add cancelled_at field to contracts
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;

-- Update refunds table to support approval workflow
ALTER TABLE public.refunds
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS supplier_invoice_id uuid REFERENCES public.supplier_invoices(id);

-- Update refunds status to use proper workflow states
-- Status values: 'pending_approval', 'approved', 'rejected', 'finalized'

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds(status);
CREATE INDEX IF NOT EXISTS idx_contracts_cancelled_at ON public.contracts(cancelled_at);

-- Add RLS policies for finance team refund approval
CREATE POLICY "Finance can approve refunds"
ON public.refunds
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND ((permissions -> 'finance'::text ->> 'manage_invoices'::text))::boolean = true
  )
);

-- Sales team can create and submit refunds
CREATE POLICY "Sales can create refunds"
ON public.refunds
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (
      ((permissions -> 'deals'::text ->> 'create'::text))::boolean = true OR
      ((permissions -> 'deals'::text ->> 'edit'::text))::boolean = true
    )
  )
);

-- Sales can view refunds they prepared
CREATE POLICY "Sales can view their refunds"
ON public.refunds
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  auth.uid() = prepared_by OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND ((permissions -> 'finance'::text ->> 'view_dashboard'::text))::boolean = true
  )
);