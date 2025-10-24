-- Drop the existing view
DROP VIEW IF EXISTS public.clients;

-- Recreate the view without SECURITY DEFINER
CREATE OR REPLACE VIEW public.clients AS
SELECT 
  s.id,
  s.lead_id,
  s.name as client_name,
  s.phone as mobile_number,
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