-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  product_type TEXT NOT NULL CHECK (product_type IN ('contract', 'fee', 'service')),
  default_duration_months INTEGER,
  default_amount NUMERIC(10,2),
  is_monthly BOOLEAN DEFAULT false,
  allows_manual_adjustment BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active products"
ON public.products
FOR SELECT
TO authenticated
USING (is_active = true);

-- Insert initial products
INSERT INTO public.products (code, name, description, product_type, default_duration_months, default_amount, is_monthly, allows_manual_adjustment) VALUES
('P1', '2 Years Contract - One Time Fee', '2 year employment contract with one-time payment', 'contract', 24, NULL, false, false),
('P4', 'Monthly Contract', 'Monthly payment contract with flexible duration', 'contract', NULL, NULL, true, false),
('P5', '2 Years Residency - One Time Fee', '2 year residency visa with one-time payment', 'contract', 24, NULL, false, false),
('TYPING_FEE', 'Typing Fee', 'Document typing and processing fee', 'fee', NULL, NULL, false, false),
('OTHER_FEES', 'Other Fees', 'Miscellaneous fees', 'fee', NULL, NULL, false, true),
('VIP_FEES', 'VIP Fees', 'VIP service fees with manual adjustments', 'fee', NULL, NULL, false, true);

-- Create contracts table (storing client info directly like deals table)
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  worker_id UUID REFERENCES public.workers(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  salesman_id UUID NOT NULL REFERENCES public.profiles(id),
  contract_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_date DATE NOT NULL,
  end_date DATE,
  duration_months INTEGER,
  monthly_amount NUMERIC(10,2),
  base_amount NUMERIC(10,2) NOT NULL,
  vat_rate NUMERIC(5,2) DEFAULT 5.00,
  vat_amount NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Completed', 'Cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contracts
CREATE POLICY "Admins can manage all contracts"
ON public.contracts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Salesmen can view their contracts"
ON public.contracts
FOR SELECT
TO authenticated
USING (salesman_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Salesmen can create contracts"
ON public.contracts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Salesmen can update their contracts"
ON public.contracts
FOR UPDATE
TO authenticated
USING (salesman_id = auth.uid() OR created_by = auth.uid());

-- Function to generate contract numbers
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  year_prefix TEXT;
BEGIN
  year_prefix := TO_CHAR(CURRENT_DATE, 'YY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM 6) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.contracts
  WHERE contract_number LIKE 'CONT-' || year_prefix || '%';
  
  RETURN 'CONT-' || year_prefix || LPAD(next_number::TEXT, 4, '0');
END;
$$;

-- Trigger for updated_at on products
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on contracts
CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();