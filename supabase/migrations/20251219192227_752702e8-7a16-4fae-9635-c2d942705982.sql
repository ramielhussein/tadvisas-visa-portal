-- Create SOP pages table (wiki-style pages)
CREATE TABLE public.sop_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL DEFAULT '',
  parent_id UUID REFERENCES public.sop_pages(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create index for faster slug lookups
CREATE INDEX idx_sop_pages_slug ON public.sop_pages(slug);
CREATE INDEX idx_sop_pages_parent ON public.sop_pages(parent_id);

-- Enable RLS
ALTER TABLE public.sop_pages ENABLE ROW LEVEL SECURITY;

-- Logged-in users can view published pages
CREATE POLICY "Authenticated users can view published SOP pages"
ON public.sop_pages
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_published = true);

-- Admins can manage all pages
CREATE POLICY "Admins can manage all SOP pages"
ON public.sop_pages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_sop_pages_updated_at
BEFORE UPDATE ON public.sop_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.sop_pages;

-- Create SOP API keys table for ChatGPT authentication
CREATE TABLE public.sop_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on API keys
ALTER TABLE public.sop_api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can manage API keys
CREATE POLICY "Admins can manage SOP API keys"
ON public.sop_api_keys
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));