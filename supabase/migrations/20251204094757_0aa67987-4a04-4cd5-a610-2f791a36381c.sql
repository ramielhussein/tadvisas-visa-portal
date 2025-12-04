-- Create cv_prospects table for quick-add phone entries (like leads)
CREATE TABLE public.cv_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_number text NOT NULL,
  name text,
  nationality_code text,
  notes text,
  status text DEFAULT 'Pending'::text,
  converted boolean DEFAULT false,
  worker_id uuid REFERENCES public.workers(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cv_prospects_mobile_unique UNIQUE (mobile_number)
);

-- Add mobile_number to workers table for contact and auto-linking
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS mobile_number text;

-- Enable RLS
ALTER TABLE public.cv_prospects ENABLE ROW LEVEL SECURITY;

-- RLS policies for cv_prospects
CREATE POLICY "Admins can manage cv_prospects" ON public.cv_prospects
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Product team can manage cv_prospects" ON public.cv_prospects
  FOR ALL USING (has_role(auth.uid(), 'product'::app_role));

CREATE POLICY "Authenticated users can view cv_prospects" ON public.cv_prospects
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert cv_prospects" ON public.cv_prospects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Add cv_wizard_settings to settings table for configurable steps
INSERT INTO public.settings (key, value) 
VALUES ('cv_wizard_public_steps', '{"identity":true,"jobs":true,"languages":true,"education":true,"experience":true,"skills":true,"visa":true,"files":true,"financials":false,"consent":true}')
ON CONFLICT (key) DO NOTHING;

-- Trigger to auto-link cv_prospects when worker is created with matching phone
CREATE OR REPLACE FUNCTION public.auto_link_cv_prospect()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.mobile_number IS NOT NULL THEN
    UPDATE public.cv_prospects
    SET converted = true, worker_id = NEW.id, updated_at = now()
    WHERE mobile_number = NEW.mobile_number AND converted = false;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger
DROP TRIGGER IF EXISTS link_cv_prospect_on_worker_insert ON public.workers;
CREATE TRIGGER link_cv_prospect_on_worker_insert
  AFTER INSERT ON public.workers
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_cv_prospect();

-- Update trigger for updated_at
CREATE TRIGGER update_cv_prospects_updated_at
  BEFORE UPDATE ON public.cv_prospects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();