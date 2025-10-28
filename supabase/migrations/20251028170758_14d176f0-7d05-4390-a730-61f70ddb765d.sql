-- Create equity_accounts table for multiple owner equity accounts
CREATE TABLE public.equity_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'Owner Capital',
  owner_name TEXT,
  opening_balance NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'AED',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equity_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage equity accounts"
ON public.equity_accounts
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view equity accounts"
ON public.equity_accounts
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_equity_accounts_updated_at
BEFORE UPDATE ON public.equity_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add equity_account_id to transactions table for better tracking
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS equity_account_id UUID REFERENCES public.equity_accounts(id);