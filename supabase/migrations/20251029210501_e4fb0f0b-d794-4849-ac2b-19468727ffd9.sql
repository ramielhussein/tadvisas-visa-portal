-- Create payments table to track all client payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT UNIQUE NOT NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  reference_number TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Function to generate payment numbers (PAY-YYNN)
CREATE OR REPLACE FUNCTION public.generate_payment_number()
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
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(payment_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.payments
  WHERE payment_number LIKE 'PAY-' || year_prefix || '%';
  
  RETURN 'PAY-' || year_prefix || LPAD(next_number::TEXT, 4, '0');
END;
$$;

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all payments"
  ON public.payments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view payments"
  ON public.payments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically update invoice when payment is recorded
CREATE OR REPLACE FUNCTION public.update_invoice_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the invoice paid_amount, balance_due, and status
  UPDATE public.invoices
  SET 
    paid_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.payments
      WHERE invoice_id = NEW.invoice_id
    ),
    balance_due = total_amount - (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.payments
      WHERE invoice_id = NEW.invoice_id
    ),
    status = CASE
      WHEN total_amount <= (
        SELECT COALESCE(SUM(amount), 0)
        FROM public.payments
        WHERE invoice_id = NEW.invoice_id
      ) THEN 'Paid'
      WHEN (
        SELECT COALESCE(SUM(amount), 0)
        FROM public.payments
        WHERE invoice_id = NEW.invoice_id
      ) > 0 THEN 'Partial'
      ELSE 'Pending'
    END,
    paid_at = CASE
      WHEN total_amount <= (
        SELECT COALESCE(SUM(amount), 0)
        FROM public.payments
        WHERE invoice_id = NEW.invoice_id
      ) THEN now()
      ELSE NULL
    END
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update invoice after payment insert
CREATE TRIGGER payment_updates_invoice
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoice_on_payment();

-- Create index for better query performance
CREATE INDEX idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX idx_payments_client_phone ON public.payments(client_phone);
CREATE INDEX idx_payments_payment_date ON public.payments(payment_date DESC);