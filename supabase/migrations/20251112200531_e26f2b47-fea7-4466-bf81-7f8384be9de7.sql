-- Enhance lead_activities to support detailed activity tracking
-- Add activity_subtype for more granular tracking
ALTER TABLE public.lead_activities 
ADD COLUMN IF NOT EXISTS activity_subtype TEXT;

-- Create index for efficient querying by date and user
CREATE INDEX IF NOT EXISTS idx_lead_activities_user_created 
ON public.lead_activities(user_id, created_at DESC);

-- Create index for efficient reminder queries  
CREATE INDEX IF NOT EXISTS idx_leads_remind_me 
ON public.leads(assigned_to, remind_me) 
WHERE remind_me IS NOT NULL;

-- Add comment to document activity types
COMMENT ON COLUMN public.lead_activities.activity_type IS 'Types: call, message, email, note, stage_change, deal_created, reminder_set, document_upload';
COMMENT ON COLUMN public.lead_activities.activity_subtype IS 'Subtypes: whatsapp, phone, sms, moved_to_warm, moved_to_hot, converted, etc.';