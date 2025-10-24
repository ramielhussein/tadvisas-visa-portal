-- Create deals table (sales/contracts)
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_number TEXT UNIQUE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  worker_name TEXT,
  service_type TEXT NOT NULL,
  service_description TEXT,
  deal_value NUMERIC(10,2) NOT NULL,
  vat_rate NUMERIC(5,2) DEFAULT 5.00,
  vat_amount NUMERIC(10,2),
  total_amount NUMERIC(10,2) NOT NULL,
  payment_terms TEXT DEFAULT 'Full Payment',
  status TEXT NOT NULL DEFAULT 'Draft',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  commission_rate NUMERIC(5,2) DEFAULT 0,
  commission_amount NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
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

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number TEXT UNIQUE NOT NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  account_type TEXT NOT NULL,
  debit_account TEXT,
  credit_account TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create account balances view
CREATE OR REPLACE VIEW public.account_balances AS
SELECT 
  i.client_name,
  i.client_phone,
  SUM(i.total_amount) as total_invoiced,
  SUM(i.paid_amount) as total_paid,
  SUM(i.balance_due) as total_outstanding,
  COUNT(i.id) FILTER (WHERE i.status = 'Pending') as pending_invoices,
  COUNT(i.id) FILTER (WHERE i.status = 'Overdue') as overdue_invoices,
  MAX(i.due_date) as latest_due_date
FROM public.invoices i
GROUP BY i.client_name, i.client_phone;

-- Enable RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deals
CREATE POLICY "Admins can view all deals"
ON public.deals FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their assigned deals"
ON public.deals FOR SELECT
USING (auth.uid() = assigned_to);

CREATE POLICY "Admins can insert deals"
ON public.deals FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update deals"
ON public.deals FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their assigned deals"
ON public.deals FOR UPDATE
USING (auth.uid() = assigned_to);

CREATE POLICY "Admins can delete deals"
ON public.deals FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for invoices
CREATE POLICY "Admins can view all invoices"
ON public.invoices FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert invoices"
ON public.invoices FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update invoices"
ON public.invoices FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete invoices"
ON public.invoices FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for transactions
CREATE POLICY "Admins can view all transactions"
ON public.transactions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert transactions"
ON public.transactions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update transactions"
ON public.transactions FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete transactions"
ON public.transactions FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_deals_updated_at
BEFORE UPDATE ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_deals_lead_id ON public.deals(lead_id);
CREATE INDEX idx_deals_worker_id ON public.deals(worker_id);
CREATE INDEX idx_deals_status ON public.deals(status);
CREATE INDEX idx_deals_assigned_to ON public.deals(assigned_to);
CREATE INDEX idx_invoices_deal_id ON public.invoices(deal_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX idx_transactions_deal_id ON public.transactions(deal_id);
CREATE INDEX idx_transactions_invoice_id ON public.transactions(invoice_id);
CREATE INDEX idx_transactions_transaction_date ON public.transactions(transaction_date);

-- Function to generate deal number
CREATE OR REPLACE FUNCTION public.generate_deal_number()
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
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(deal_number FROM 6) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.deals
  WHERE deal_number LIKE 'DEAL-' || year_prefix || '%';
  
  RETURN 'DEAL-' || year_prefix || LPAD(next_number::TEXT, 4, '0');
END;
$$;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
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
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.invoices
  WHERE invoice_number LIKE 'INV-' || year_prefix || '%';
  
  RETURN 'INV-' || year_prefix || LPAD(next_number::TEXT, 4, '0');
END;
$$;

-- Function to generate transaction number
CREATE OR REPLACE FUNCTION public.generate_transaction_number()
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
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.transactions
  WHERE transaction_number LIKE 'TXN-' || year_prefix || '%';
  
  RETURN 'TXN-' || year_prefix || LPAD(next_number::TEXT, 4, '0');
END;
$$;