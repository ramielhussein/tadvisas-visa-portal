-- Add unique constraint to mobile_number in leads table to prevent duplicates
ALTER TABLE public.leads ADD CONSTRAINT leads_mobile_number_unique UNIQUE (mobile_number);