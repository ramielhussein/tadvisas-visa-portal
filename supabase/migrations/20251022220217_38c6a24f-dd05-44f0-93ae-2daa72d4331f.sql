-- Allow client_name to be nullable since users can submit leads with just phone numbers
ALTER TABLE public.leads ALTER COLUMN client_name DROP NOT NULL;