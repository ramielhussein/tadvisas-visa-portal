-- Add visa_expiry_date field to leads table
ALTER TABLE public.leads 
ADD COLUMN visa_expiry_date date;

-- Add index for better query performance
CREATE INDEX idx_leads_visa_expiry_date ON public.leads(visa_expiry_date);

-- Add comment for documentation
COMMENT ON COLUMN public.leads.visa_expiry_date IS 'Client or worker visa expiry date for follow-up tracking';
