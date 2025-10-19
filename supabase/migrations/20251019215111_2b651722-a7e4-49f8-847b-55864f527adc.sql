-- Create workers table for CV data
CREATE TABLE public.workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_no text UNIQUE NOT NULL,
  passport_expiry date NOT NULL,
  center_ref text,
  name text NOT NULL,
  age int NOT NULL CHECK (age >= 18 AND age <= 60),
  religion text NOT NULL,
  nationality_code text NOT NULL,
  maid_status text NOT NULL,
  job1 text NOT NULL,
  job2 text,
  height_cm int CHECK (height_cm >= 120 AND height_cm <= 210),
  weight_kg int CHECK (weight_kg >= 35 AND weight_kg <= 140),
  marital_status text NOT NULL,
  children int DEFAULT 0 CHECK (children >= 0 AND children <= 10),
  languages jsonb DEFAULT '[]'::jsonb,
  education jsonb DEFAULT '{}'::jsonb,
  experience jsonb DEFAULT '[]'::jsonb,
  skills jsonb DEFAULT '{}'::jsonb,
  visa jsonb DEFAULT '{}'::jsonb,
  files jsonb DEFAULT '{}'::jsonb,
  employers jsonb DEFAULT '[]'::jsonb,
  employer_count int DEFAULT 0,
  financials jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'Available',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create settings table for webhook configuration
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Workers policies (public can insert, admins can view/edit)
CREATE POLICY "Anyone can submit worker CVs"
  ON public.workers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all workers"
  ON public.workers
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update workers"
  ON public.workers
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete workers"
  ON public.workers
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Settings policies (admins only)
CREATE POLICY "Admins can view settings"
  ON public.settings
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert settings"
  ON public.settings
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update settings"
  ON public.settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_workers_updated_at
  BEFORE UPDATE ON public.workers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create cvs storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', false);

-- Storage policies for cvs bucket
CREATE POLICY "Anyone can upload to cvs bucket"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'cvs');

CREATE POLICY "Admins can view cvs files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'cvs' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete cvs files"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'cvs' AND has_role(auth.uid(), 'admin'::app_role));