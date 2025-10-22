-- Create enum for lead status
CREATE TYPE public.lead_status AS ENUM ('New Lead', 'Warm', 'HOT', 'SOLD', 'LOST', 'PROBLEM');

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  email TEXT,
  mobile_number TEXT NOT NULL,
  emirate TEXT,
  passport_copy_url TEXT,
  eid_front_url TEXT,
  eid_back_url TEXT,
  status lead_status NOT NULL DEFAULT 'New Lead',
  remind_me DATE NOT NULL,
  service_required TEXT,
  nationality_code TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for CRM documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('crm-documents', 'crm-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on leads table
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads table
CREATE POLICY "Admins can view all leads"
ON public.leads
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view their assigned leads"
ON public.leads
FOR SELECT
USING (auth.uid() = assigned_to);

CREATE POLICY "Admins can insert leads"
ON public.leads
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can insert leads"
ON public.leads
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update all leads"
ON public.leads
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their assigned leads"
ON public.leads
FOR UPDATE
USING (auth.uid() = assigned_to);

CREATE POLICY "Admins can delete leads"
ON public.leads
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for crm-documents bucket
CREATE POLICY "Authenticated users can upload to crm-documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'crm-documents' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can view crm-documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'crm-documents' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Admins can delete from crm-documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'crm-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Trigger to update remind_me date on insert (2 years from creation)
CREATE OR REPLACE FUNCTION public.set_lead_remind_me()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.remind_me IS NULL THEN
    NEW.remind_me := NEW.created_at::date + INTERVAL '2 years';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_lead_remind_me_trigger
BEFORE INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.set_lead_remind_me();

-- Trigger to update updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for phone number search
CREATE INDEX idx_leads_mobile_number ON public.leads(mobile_number);
CREATE INDEX idx_leads_client_name ON public.leads(client_name);
CREATE INDEX idx_leads_status ON public.leads(status);