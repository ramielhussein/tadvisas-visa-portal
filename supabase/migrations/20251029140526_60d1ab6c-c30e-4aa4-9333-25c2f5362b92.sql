-- Create enum for PO status
CREATE TYPE po_status AS ENUM ('Draft', 'Pending Approval', 'Approved', 'Paid', 'Cancelled');

-- Create enum for transfer types
CREATE TYPE transfer_type AS ENUM ('Airport to Accommodation', 'Accommodation to Office', 'Office to Center', 'Center to Client', 'Client to Accommodation', 'Client to Office', 'Between Accommodations');

-- Create enum for order status
CREATE TYPE order_status AS ENUM ('Pending', 'Completed', 'Cancelled');

-- 1. Purchase Orders Table
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL UNIQUE,
  worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  approved_by UUID,
  status po_status NOT NULL DEFAULT 'Draft',
  po_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AED',
  payment_terms TEXT,
  notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Receipt Orders Table (worker arrival)
CREATE TABLE public.receipt_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT NOT NULL UNIQUE,
  worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE NOT NULL,
  po_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  received_by UUID NOT NULL,
  receipt_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  received_from TEXT NOT NULL, -- 'Airport', 'Driver', 'Supplier', etc.
  location TEXT NOT NULL, -- 'Center', 'Accommodation', etc.
  condition_notes TEXT,
  documents_received JSONB DEFAULT '[]',
  status order_status NOT NULL DEFAULT 'Completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Delivery Orders Table (worker handover to client)
CREATE TABLE public.delivery_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_number TEXT NOT NULL UNIQUE,
  worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE NOT NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  delivered_by UUID NOT NULL,
  delivery_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_signature TEXT, -- URL to signature image
  delivery_location TEXT NOT NULL,
  items_delivered JSONB DEFAULT '[]', -- worker belongings, documents, etc.
  notes TEXT,
  status order_status NOT NULL DEFAULT 'Completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Worker Transfers Table (unified transfer tracking)
CREATE TABLE public.worker_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number TEXT NOT NULL UNIQUE,
  worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE NOT NULL,
  transfer_type transfer_type NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  transfer_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  handled_by UUID NOT NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  client_name TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  vehicle_number TEXT,
  notes TEXT,
  documents JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Worker Returns Table (returned worker checklist)
CREATE TABLE public.worker_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE NOT NULL,
  return_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  returned_from TEXT NOT NULL, -- client name
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  visa_cancelled BOOLEAN NOT NULL DEFAULT false,
  visa_cancellation_date DATE,
  belongings_returned BOOLEAN NOT NULL DEFAULT false,
  phone_returned BOOLEAN NOT NULL DEFAULT false,
  evaluation_completed BOOLEAN NOT NULL DEFAULT false,
  evaluation_notes TEXT,
  ready_to_redeploy BOOLEAN NOT NULL DEFAULT false,
  cleared_by UUID,
  cleared_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Nationality Workflows Table (process tracking by nationality)
CREATE TABLE public.nationality_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE NOT NULL,
  nationality_code TEXT NOT NULL,
  current_step TEXT NOT NULL,
  workflow_status TEXT NOT NULL DEFAULT 'In Progress', -- 'In Progress', 'Completed', 'Blocked'
  agent_informed_date DATE,
  po_raised_date DATE,
  medical_obtained_date DATE,
  visa_applied_date DATE,
  visa_received_date DATE,
  visa_type TEXT, -- 'Tourist', 'Employment', 'Visit'
  ticket_booked_date DATE,
  travel_date DATE,
  arrival_date DATE,
  documents JSONB DEFAULT '{}',
  notes TEXT,
  created_by UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Daily Headcount Table (snapshot of daily worker counts)
CREATE TABLE public.daily_headcount (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_date DATE NOT NULL UNIQUE,
  total_workers INTEGER NOT NULL DEFAULT 0,
  at_center INTEGER NOT NULL DEFAULT 0,
  at_accommodation INTEGER NOT NULL DEFAULT 0,
  with_clients INTEGER NOT NULL DEFAULT 0,
  in_transit INTEGER NOT NULL DEFAULT 0,
  returned_processing INTEGER NOT NULL DEFAULT 0,
  discrepancies JSONB DEFAULT '[]',
  counted_by UUID NOT NULL,
  verified_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Generate PO number function
CREATE OR REPLACE FUNCTION generate_po_number()
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
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.purchase_orders
  WHERE po_number LIKE 'PO-' || year_prefix || '%';
  
  RETURN 'PO-' || year_prefix || LPAD(next_number::TEXT, 4, '0');
END;
$$;

-- Generate receipt number function
CREATE OR REPLACE FUNCTION generate_receipt_number()
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
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.receipt_orders
  WHERE receipt_number LIKE 'RCP-' || year_prefix || '%';
  
  RETURN 'RCP-' || year_prefix || LPAD(next_number::TEXT, 4, '0');
END;
$$;

-- Generate delivery number function
CREATE OR REPLACE FUNCTION generate_delivery_number()
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
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(delivery_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.delivery_orders
  WHERE delivery_number LIKE 'DEL-' || year_prefix || '%';
  
  RETURN 'DEL-' || year_prefix || LPAD(next_number::TEXT, 4, '0');
END;
$$;

-- Generate transfer number function
CREATE OR REPLACE FUNCTION generate_transfer_number()
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
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(transfer_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.worker_transfers
  WHERE transfer_number LIKE 'TRF-' || year_prefix || '%';
  
  RETURN 'TRF-' || year_prefix || LPAD(next_number::TEXT, 4, '0');
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_purchase_orders_updated_at
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_receipt_orders_updated_at
BEFORE UPDATE ON public.receipt_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_orders_updated_at
BEFORE UPDATE ON public.delivery_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_worker_transfers_updated_at
BEFORE UPDATE ON public.worker_transfers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_worker_returns_updated_at
BEFORE UPDATE ON public.worker_returns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nationality_workflows_updated_at
BEFORE UPDATE ON public.nationality_workflows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_headcount_updated_at
BEFORE UPDATE ON public.daily_headcount
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nationality_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_headcount ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Purchase Orders
CREATE POLICY "Admins can manage all purchase orders"
ON public.purchase_orders FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Product team can create purchase orders"
ON public.purchase_orders FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Product team can view their purchase orders"
ON public.purchase_orders FOR SELECT
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Product team can update their draft purchase orders"
ON public.purchase_orders FOR UPDATE
USING (auth.uid() = created_by AND status = 'Draft');

-- RLS Policies for Receipt Orders
CREATE POLICY "Admins can manage all receipt orders"
ON public.receipt_orders FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Product team can create receipt orders"
ON public.receipt_orders FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Product team can view receipt orders"
ON public.receipt_orders FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies for Delivery Orders
CREATE POLICY "Admins can manage all delivery orders"
ON public.delivery_orders FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Product team can create delivery orders"
ON public.delivery_orders FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Product team can view delivery orders"
ON public.delivery_orders FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies for Worker Transfers
CREATE POLICY "Admins can manage all transfers"
ON public.worker_transfers FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Product team can create transfers"
ON public.worker_transfers FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Product team can view transfers"
ON public.worker_transfers FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies for Worker Returns
CREATE POLICY "Admins can manage all returns"
ON public.worker_returns FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Product team can create returns"
ON public.worker_returns FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Product team can view returns"
ON public.worker_returns FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Product team can update returns"
ON public.worker_returns FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- RLS Policies for Nationality Workflows
CREATE POLICY "Admins can manage all workflows"
ON public.nationality_workflows FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Product team can create workflows"
ON public.nationality_workflows FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Product team can view workflows"
ON public.nationality_workflows FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Product team can update workflows"
ON public.nationality_workflows FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- RLS Policies for Daily Headcount
CREATE POLICY "Admins can manage all headcounts"
ON public.daily_headcount FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Product team can create headcounts"
ON public.daily_headcount FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Product team can view headcounts"
ON public.daily_headcount FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Product team can update today's headcount"
ON public.daily_headcount FOR UPDATE
USING (auth.uid() = counted_by AND count_date = CURRENT_DATE);