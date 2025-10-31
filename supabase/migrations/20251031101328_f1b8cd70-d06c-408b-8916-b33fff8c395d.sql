-- Create sales_targets table for KPI tracking
CREATE TABLE IF NOT EXISTS public.sales_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'monthly', -- 'monthly' or 'quarterly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  revenue_target NUMERIC NOT NULL DEFAULT 0,
  deals_target INTEGER NOT NULL DEFAULT 0,
  conversion_rate_target NUMERIC NOT NULL DEFAULT 0, -- percentage
  activity_target INTEGER NOT NULL DEFAULT 0, -- calls/emails/whatsapp combined
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  notes TEXT,
  CONSTRAINT unique_user_period UNIQUE(user_id, period_start, period_end)
);

-- Enable Row Level Security
ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;

-- Admin can manage all targets
CREATE POLICY "Admins can manage all targets"
ON public.sales_targets
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Users can view their own targets
CREATE POLICY "Users can view their own targets"
ON public.sales_targets
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_sales_targets_user_period ON public.sales_targets(user_id, period_start, period_end);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sales_targets_updated_at
BEFORE UPDATE ON public.sales_targets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();