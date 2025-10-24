-- Create bank accounts table
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT,
  currency TEXT DEFAULT 'AED',
  opening_balance NUMERIC(10,2) DEFAULT 0,
  current_balance NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'Active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment methods table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method_name TEXT UNIQUE NOT NULL,
  commission_rate NUMERIC(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create suppliers/vendors table (for A/P)
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name TEXT NOT NULL,
  supplier_type TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_registration TEXT,
  payment_terms TEXT DEFAULT 'Net 30',
  account_balance NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'Active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supplier invoices/bills table (A/P)
CREATE TABLE public.supplier_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  description TEXT,
  subtotal NUMERIC(10,2) NOT NULL,
  vat_rate NUMERIC(5,2) DEFAULT 5.00,
  vat_amount NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  balance_due NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Update transactions table to include banks and payment fees
ALTER TABLE public.transactions
ADD COLUMN bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
ADD COLUMN supplier_invoice_id UUID REFERENCES public.supplier_invoices(id) ON DELETE SET NULL,
ADD COLUMN payment_commission_rate NUMERIC(5,2) DEFAULT 0,
ADD COLUMN payment_commission_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN net_amount NUMERIC(10,2);

-- Create accounts payable view
CREATE OR REPLACE VIEW public.supplier_balances AS
SELECT 
  s.id as supplier_id,
  s.supplier_name,
  s.supplier_type,
  s.phone,
  SUM(si.total_amount) as total_invoiced,
  SUM(si.paid_amount) as total_paid,
  SUM(si.balance_due) as total_outstanding,
  COUNT(si.id) FILTER (WHERE si.status = 'Pending') as pending_invoices,
  COUNT(si.id) FILTER (WHERE si.status = 'Overdue') as overdue_invoices,
  MAX(si.due_date) as latest_due_date
FROM public.suppliers s
LEFT JOIN public.supplier_invoices si ON s.id = si.supplier_id
GROUP BY s.id, s.supplier_name, s.supplier_type, s.phone;

-- Enable RLS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bank_accounts
CREATE POLICY "Admins can view all bank accounts"
ON public.bank_accounts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage bank accounts"
ON public.bank_accounts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for payment_methods
CREATE POLICY "Admins can view payment methods"
ON public.payment_methods FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage payment methods"
ON public.payment_methods FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for suppliers
CREATE POLICY "Admins can view all suppliers"
ON public.suppliers FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage suppliers"
ON public.suppliers FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for supplier_invoices
CREATE POLICY "Admins can view all supplier invoices"
ON public.supplier_invoices FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage supplier invoices"
ON public.supplier_invoices FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers
CREATE TRIGGER update_bank_accounts_updated_at
BEFORE UPDATE ON public.bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_invoices_updated_at
BEFORE UPDATE ON public.supplier_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_bank_accounts_status ON public.bank_accounts(status);
CREATE INDEX idx_suppliers_type ON public.suppliers(supplier_type);
CREATE INDEX idx_suppliers_status ON public.suppliers(status);
CREATE INDEX idx_supplier_invoices_supplier_id ON public.supplier_invoices(supplier_id);
CREATE INDEX idx_supplier_invoices_status ON public.supplier_invoices(status);
CREATE INDEX idx_supplier_invoices_due_date ON public.supplier_invoices(due_date);
CREATE INDEX idx_transactions_bank_account_id ON public.transactions(bank_account_id);
CREATE INDEX idx_transactions_supplier_id ON public.transactions(supplier_id);

-- Insert default bank accounts
INSERT INTO public.bank_accounts (bank_name, account_name, currency, status) VALUES
('ADIB', 'ADIB Business Account', 'AED', 'Active'),
('RAK Bank', 'RAK Bank Business Account', 'AED', 'Active');

-- Insert payment methods with commission rates
INSERT INTO public.payment_methods (method_name, commission_rate, is_active, notes) VALUES
('Cash', 0, true, 'No commission'),
('Card', 1.5, true, 'Card issuer commission 1.5%'),
('Payment Link', 1.5, true, 'Payment gateway 1.5%'),
('Tabby', 8, true, 'Buy now pay later - 8% commission'),
('Tamara', 8, true, 'Buy now pay later - 8% commission'),
('Bank Transfer', 0, true, 'Direct bank transfer');

-- Function to calculate net amount after commission
CREATE OR REPLACE FUNCTION public.calculate_net_amount(
  gross_amount NUMERIC,
  commission_rate NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  commission_amount NUMERIC;
  net_amount NUMERIC;
BEGIN
  commission_amount := (gross_amount * commission_rate) / 100;
  net_amount := gross_amount - commission_amount;
  RETURN net_amount;
END;
$$;

-- Function to generate supplier invoice number
CREATE OR REPLACE FUNCTION public.generate_supplier_invoice_number()
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
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 6) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.supplier_invoices
  WHERE invoice_number LIKE 'BILL-' || year_prefix || '%';
  
  RETURN 'BILL-' || year_prefix || LPAD(next_number::TEXT, 4, '0');
END;
$$;