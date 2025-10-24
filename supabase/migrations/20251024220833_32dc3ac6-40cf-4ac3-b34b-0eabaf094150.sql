-- Create lead_activities table for tracking all interactions
CREATE TABLE public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'note', 'call', 'email', 'meeting', 'whatsapp', 'status_change', 'assignment'
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Admins can view all activities
CREATE POLICY "Admins can view all activities"
ON public.lead_activities
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view activities for their assigned leads
CREATE POLICY "Users can view activities for assigned leads"
ON public.lead_activities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = lead_activities.lead_id
    AND leads.assigned_to = auth.uid()
  )
);

-- Admins can insert activities
CREATE POLICY "Admins can insert activities"
ON public.lead_activities
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can insert activities for their assigned leads
CREATE POLICY "Users can insert activities for assigned leads"
ON public.lead_activities
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = lead_activities.lead_id
    AND leads.assigned_to = auth.uid()
  )
);

-- Admins can update activities
CREATE POLICY "Admins can update activities"
ON public.lead_activities
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can update their own activities
CREATE POLICY "Users can update their own activities"
ON public.lead_activities
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can delete activities
CREATE POLICY "Admins can delete activities"
ON public.lead_activities
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updating updated_at
CREATE TRIGGER update_lead_activities_updated_at
BEFORE UPDATE ON public.lead_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX idx_lead_activities_created_at ON public.lead_activities(created_at DESC);