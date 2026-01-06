-- Fix linter warnings: ensure views are SECURITY INVOKER and functions have immutable search_path

-- Recreate views as SECURITY INVOKER (do not bypass RLS)
CREATE OR REPLACE VIEW public.account_balances
WITH (security_invoker = true)
AS
SELECT
  client_name,
  client_phone,
  sum(total_amount) AS total_invoiced,
  sum(paid_amount) AS total_paid,
  sum(balance_due) AS total_outstanding,
  count(id) FILTER (WHERE status = 'Pending'::text) AS pending_invoices,
  count(id) FILTER (WHERE status = 'Overdue'::text) AS overdue_invoices,
  max(due_date) AS latest_due_date
FROM public.invoices i
GROUP BY client_name, client_phone;

CREATE OR REPLACE VIEW public.clients
WITH (security_invoker = true)
AS
SELECT
  s.id,
  s.lead_id,
  s.name AS client_name,
  s.phone AS mobile_number,
  s.email,
  s.package,
  s.addons,
  s.emirates_id_front_url,
  s.emirates_id_back_url,
  s.worker_photo_url,
  s.dewa_bill_url,
  s.maid_passport_url,
  s.maid_photo_url,
  s.maid_visa_url,
  s.status,
  s.medical_insurance,
  s.installment_plan,
  s.notes,
  s.created_at,
  s.updated_at,
  l.emirate,
  l.nationality_code,
  l.service_required
FROM public.submissions s
LEFT JOIN public.leads l ON s.lead_id = l.id;

CREATE OR REPLACE VIEW public.sales_performance
WITH (security_invoker = true)
AS
SELECT
  assigned_to,
  count(*) FILTER (WHERE status = 'New Lead'::public.lead_status) AS new_leads,
  count(*) FILTER (WHERE status = 'Warm'::public.lead_status) AS warm_leads,
  count(*) FILTER (WHERE status = 'HOT'::public.lead_status) AS hot_leads,
  count(*) FILTER (WHERE status = 'SOLD'::public.lead_status) AS sold_leads,
  count(*) FILTER (WHERE status = 'LOST'::public.lead_status) AS lost_leads,
  count(*) AS total_leads,
  round(
    count(*) FILTER (WHERE status = 'SOLD'::public.lead_status)::numeric
    / NULLIF(count(*) FILTER (WHERE status = ANY (ARRAY['SOLD'::public.lead_status, 'LOST'::public.lead_status])), 0)::numeric
    * 100::numeric,
    2
  ) AS conversion_rate
FROM public.leads
WHERE assigned_to IS NOT NULL
GROUP BY assigned_to;

CREATE OR REPLACE VIEW public.supplier_balances
WITH (security_invoker = true)
AS
SELECT
  s.id AS supplier_id,
  s.supplier_name,
  s.supplier_type,
  s.phone,
  COALESCE(sum(si.total_amount), 0::numeric) AS total_invoiced,
  COALESCE(sum(si.paid_amount), 0::numeric) AS total_paid,
  COALESCE(sum(si.balance_due), 0::numeric) AS total_outstanding,
  count(si.id) FILTER (WHERE si.status = 'Pending'::text) AS pending_invoices,
  count(si.id) FILTER (WHERE si.status = 'Overdue'::text) AS overdue_invoices,
  max(si.due_date) AS latest_due_date
FROM public.suppliers s
LEFT JOIN public.supplier_invoices si ON s.id = si.supplier_id
GROUP BY s.id, s.supplier_name, s.supplier_type, s.phone;

-- Fix function search_path warnings
CREATE OR REPLACE FUNCTION public.calculate_net_amount(gross_amount numeric, commission_rate numeric)
RETURNS numeric
LANGUAGE plpgsql
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.set_employee_user_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- If user_id is not set, try to find matching profile by email
  IF NEW.user_id IS NULL AND NEW.email IS NOT NULL THEN
    SELECT id INTO NEW.user_id
    FROM public.profiles
    WHERE email = NEW.email
    LIMIT 1;
  END IF;

  -- If still no user_id and created_by is set, use created_by
  IF NEW.user_id IS NULL AND NEW.created_by IS NOT NULL THEN
    NEW.user_id := NEW.created_by;
  END IF;

  RETURN NEW;
END;
$$;