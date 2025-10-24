-- Create refunds table to store finalized refund calculations
CREATE TABLE public.refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Form metadata
  prepared_by UUID REFERENCES public.profiles(id),
  finalized_by UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'finalized',
  
  -- Step 1: Basics
  contract_no TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_mobile TEXT,
  emirate TEXT NOT NULL,
  worker_name TEXT NOT NULL,
  nationality TEXT NOT NULL,
  salary_aed DECIMAL(10,2),
  price_incl_vat DECIMAL(10,2) NOT NULL,
  vat_percent DECIMAL(5,2) DEFAULT 5,
  
  -- Step 2: Scenario
  location TEXT NOT NULL,
  direct_hire BOOLEAN DEFAULT false,
  fail_bring BOOLEAN DEFAULT false,
  at_fault BOOLEAN DEFAULT false,
  enough_time BOOLEAN DEFAULT true,
  stage TEXT,
  cash_assistance_aed DECIMAL(10,2) DEFAULT 0,
  gov_visa_aed DECIMAL(10,2) DEFAULT 0,
  reason TEXT,
  other_reason TEXT,
  medical_visa_cost_aed DECIMAL(10,2) DEFAULT 0,
  
  -- Step 3: Delivery & Docs
  delivered_date DATE,
  returned_date DATE,
  doc_phone BOOLEAN DEFAULT false,
  doc_passport BOOLEAN DEFAULT false,
  doc_cancel BOOLEAN DEFAULT false,
  abu_dhabi_insurance_cancelled BOOLEAN DEFAULT false,
  abscond_report BOOLEAN DEFAULT false,
  abscond_date DATE,
  unpaid_salary_days INTEGER DEFAULT 0,
  
  -- Step 4: Visa/VPA
  visa_vpa_done BOOLEAN DEFAULT false,
  option_b BOOLEAN DEFAULT false,
  standard_tadbeer_fees_aed DECIMAL(10,2) DEFAULT 0,
  
  -- Calculation results
  base_price_ex_vat DECIMAL(10,2),
  vat_amount DECIMAL(10,2),
  vat_refund DECIMAL(10,2),
  refund_ex_vat DECIMAL(10,2),
  total_refund_amount DECIMAL(10,2) NOT NULL,
  days_worked INTEGER,
  due_date DATE,
  calculation_details JSONB,
  
  -- Notes
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Admins can view all refunds
CREATE POLICY "Admins can view all refunds"
ON public.refunds
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert refunds
CREATE POLICY "Admins can insert refunds"
ON public.refunds
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update refunds
CREATE POLICY "Admins can update refunds"
ON public.refunds
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete refunds
CREATE POLICY "Admins can delete refunds"
ON public.refunds
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users with refund.create permission can view refunds they prepared
CREATE POLICY "Users can view their prepared refunds"
ON public.refunds
FOR SELECT
USING (
  auth.uid() = prepared_by OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND permissions->>'refund' IS NOT NULL
    AND (permissions->'refund'->>'create')::boolean = true
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_refunds_updated_at
BEFORE UPDATE ON public.refunds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_refunds_status ON public.refunds(status);
CREATE INDEX idx_refunds_contract_no ON public.refunds(contract_no);
CREATE INDEX idx_refunds_client_name ON public.refunds(client_name);
CREATE INDEX idx_refunds_created_at ON public.refunds(created_at DESC);