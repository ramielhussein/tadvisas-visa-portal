-- Add lead_id to submissions table to link clients to leads
ALTER TABLE public.submissions
ADD COLUMN lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_submissions_lead_id ON public.submissions(lead_id);

-- Add client_converted flag to leads table
ALTER TABLE public.leads
ADD COLUMN client_converted boolean DEFAULT false,
ADD COLUMN submission_id uuid REFERENCES public.submissions(id) ON DELETE SET NULL;

-- Create index for client conversion tracking
CREATE INDEX idx_leads_client_converted ON public.leads(client_converted);
CREATE INDEX idx_leads_submission_id ON public.leads(submission_id);

-- Update RLS policies for submissions to allow lead-based access
CREATE POLICY "Users can view submissions linked to their assigned leads"
ON public.submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = submissions.lead_id
    AND leads.assigned_to = auth.uid()
  )
);

-- Create a view for easy client lookup (submissions with complete data)
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

-- Grant access to the clients view
GRANT SELECT ON public.clients TO authenticated;