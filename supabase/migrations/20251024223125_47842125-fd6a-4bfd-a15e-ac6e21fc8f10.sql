-- Add currency support to suppliers
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS currency text DEFAULT 'AED' CHECK (currency IN ('AED', 'USD'));

-- Create worker_suppliers junction table to link workers to suppliers with costs
CREATE TABLE IF NOT EXISTS public.worker_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES public.workers(id) ON DELETE CASCADE NOT NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  cost_amount numeric NOT NULL DEFAULT 0,
  cost_currency text DEFAULT 'AED' CHECK (cost_currency IN ('AED', 'USD')),
  cost_type text NOT NULL, -- 'Agency', 'Medical', 'Visa', 'Travel', 'Other'
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(worker_id, supplier_id, cost_type)
);

-- Enable RLS
ALTER TABLE public.worker_suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for worker_suppliers
CREATE POLICY "Admins can view all worker suppliers"
  ON public.worker_suppliers FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage worker suppliers"
  ON public.worker_suppliers FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_worker_suppliers_updated_at
  BEFORE UPDATE ON public.worker_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles permissions structure to include new modules
-- Adding deals, finance, suppliers permissions
COMMENT ON COLUMN public.profiles.permissions IS 'JSON structure: {
  "cv": {"create": bool, "edit": bool, "delete": bool},
  "refund": {"create": bool},
  "leads": {"create": bool, "assign": bool},
  "deals": {"create": bool, "edit": bool, "delete": bool, "view_all": bool},
  "finance": {"view_dashboard": bool, "manage_invoices": bool, "manage_transactions": bool},
  "suppliers": {"create": bool, "edit": bool, "view_all": bool}
}';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_worker_suppliers_worker_id ON public.worker_suppliers(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_suppliers_supplier_id ON public.worker_suppliers(supplier_id);