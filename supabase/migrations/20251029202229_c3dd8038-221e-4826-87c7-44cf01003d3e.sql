-- Create inquiry packages table for lead interests
CREATE TABLE public.inquiry_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inquiry_packages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage inquiry packages"
ON public.inquiry_packages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active inquiry packages"
ON public.inquiry_packages
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_inquiry_packages_updated_at
BEFORE UPDATE ON public.inquiry_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Pre-populate inquiry packages
INSERT INTO public.inquiry_packages (package_name, description, is_active, sort_order) VALUES
('P1 Traditional Package', 'Traditional household package', true, 1),
('P4 Monthly', 'Monthly payment package', true, 2),
('P5 Tadvisas', 'Tadvisas standard package', true, 3),
('P5 Tadvisas+', 'Tadvisas plus package', true, 4),
('P5 Tadvisas++', 'Tadvisas premium package', true, 5),
('Typing', 'Typing services', true, 6),
('P6', 'P6 package', true, 7),
('Driver', 'Driver services', true, 8),
('DIRECT', 'Direct hire', true, 9),
('Cook', 'Cooking services', true, 10),
('Caregiver', 'Caregiver services', true, 11),
('Nurse', 'Nursing services', true, 12),
('Skilled', 'Skilled worker', true, 13)
ON CONFLICT (package_name) DO NOTHING;