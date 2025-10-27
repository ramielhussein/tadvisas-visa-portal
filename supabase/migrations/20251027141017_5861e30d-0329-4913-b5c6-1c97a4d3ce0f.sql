-- Drop the view temporarily
DROP VIEW IF EXISTS public.supplier_balances CASCADE;

-- Update supplier_type to be more flexible
ALTER TABLE public.suppliers DROP CONSTRAINT IF EXISTS suppliers_supplier_type_check;

-- Ensure the column is text type
ALTER TABLE public.suppliers 
  ALTER COLUMN supplier_type TYPE text;

-- Create a suggested_supplier_types table
CREATE TABLE IF NOT EXISTS public.suggested_supplier_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert the new supplier categories
INSERT INTO public.suggested_supplier_types (type_name, sort_order) VALUES
  ('IN COUNTRY TADBEER', 1),
  ('Foreign Agent', 2),
  ('Foreign Agency', 3),
  ('LOCAL SUPPLIER', 4),
  ('LOCAL TABLE', 5),
  ('UTILITY PROVIDER', 6),
  ('VISA PROVIDER', 7),
  ('OTHER', 8)
ON CONFLICT (type_name) DO NOTHING;

-- Recreate the supplier_balances view
CREATE OR REPLACE VIEW public.supplier_balances AS
SELECT 
  s.id AS supplier_id,
  s.supplier_name,
  s.supplier_type,
  s.phone,
  COALESCE(SUM(si.total_amount), 0) AS total_invoiced,
  COALESCE(SUM(si.paid_amount), 0) AS total_paid,
  COALESCE(SUM(si.balance_due), 0) AS total_outstanding,
  COUNT(si.id) FILTER (WHERE si.status = 'Pending') AS pending_invoices,
  COUNT(si.id) FILTER (WHERE si.status = 'Overdue') AS overdue_invoices,
  MAX(si.due_date) AS latest_due_date
FROM public.suppliers s
LEFT JOIN public.supplier_invoices si ON s.id = si.supplier_id
GROUP BY s.id, s.supplier_name, s.supplier_type, s.phone;

-- Enable RLS on the new table
ALTER TABLE public.suggested_supplier_types ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view supplier types
CREATE POLICY "Authenticated users can view supplier types"
  ON public.suggested_supplier_types
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow admins to manage supplier types
CREATE POLICY "Admins can manage supplier types"
  ON public.suggested_supplier_types
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));