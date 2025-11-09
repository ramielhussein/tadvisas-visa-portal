-- Create table for ALH pilot program requests
CREATE TABLE public.alh_pilot_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  community TEXT NOT NULL,
  monthly_handovers TEXT NOT NULL,
  tracks TEXT[] NOT NULL,
  preferred_start DATE,
  notes TEXT,
  source TEXT DEFAULT 'alh-72h',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.alh_pilot_requests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (public form submissions)
CREATE POLICY "Anyone can submit pilot requests"
ON public.alh_pilot_requests
FOR INSERT
WITH CHECK (true);

-- Create policy for admins to view all requests
CREATE POLICY "Admins can view all pilot requests"
ON public.alh_pilot_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_alh_pilot_requests_created_at ON public.alh_pilot_requests(created_at DESC);