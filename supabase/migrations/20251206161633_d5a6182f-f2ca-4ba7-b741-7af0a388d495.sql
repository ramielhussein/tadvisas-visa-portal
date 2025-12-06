-- Create deal_costs table for tracking Cost of Goods Sold (COGS)
CREATE TABLE public.deal_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  cost_category TEXT NOT NULL, -- 'worker_cost', 'visa_cost', 'medical', 'commission', 'transport', 'other'
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  supplier_id UUID REFERENCES public.suppliers(id),
  po_id UUID REFERENCES public.purchase_orders(id),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deal_costs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage deal costs"
  ON public.deal_costs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their deal costs"
  ON public.deal_costs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_costs.deal_id 
      AND deals.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Users can insert costs for their deals"
  ON public.deal_costs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_costs.deal_id 
      AND deals.assigned_to = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_deal_costs_updated_at
  BEFORE UPDATE ON public.deal_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes
CREATE INDEX idx_deal_costs_deal_id ON public.deal_costs(deal_id);
CREATE INDEX idx_deal_costs_category ON public.deal_costs(cost_category);