-- Add lead_source column to leads table
ALTER TABLE public.leads
ADD COLUMN lead_source TEXT;

-- Add index for better performance on source queries
CREATE INDEX idx_leads_lead_source ON public.leads(lead_source);

-- Create a view for sales performance metrics
CREATE OR REPLACE VIEW public.sales_performance AS
SELECT 
  assigned_to,
  COUNT(*) FILTER (WHERE status = 'New Lead') as new_leads,
  COUNT(*) FILTER (WHERE status = 'Warm') as warm_leads,
  COUNT(*) FILTER (WHERE status = 'HOT') as hot_leads,
  COUNT(*) FILTER (WHERE status = 'SOLD') as sold_leads,
  COUNT(*) FILTER (WHERE status = 'LOST') as lost_leads,
  COUNT(*) as total_leads,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'SOLD')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE status IN ('SOLD', 'LOST')), 0) * 100), 
    2
  ) as conversion_rate
FROM public.leads
WHERE assigned_to IS NOT NULL
GROUP BY assigned_to;