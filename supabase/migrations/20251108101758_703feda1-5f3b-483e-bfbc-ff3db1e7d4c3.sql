-- Add fields to track LOST lead history
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS lost_reason text,
ADD COLUMN IF NOT EXISTS lost_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS lost_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS previously_lost boolean DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_previously_lost ON leads(previously_lost) WHERE previously_lost = true;

-- Add comment for documentation
COMMENT ON COLUMN leads.lost_reason IS 'Reason why the lead was marked as LOST';
COMMENT ON COLUMN leads.lost_by IS 'User who marked the lead as LOST';
COMMENT ON COLUMN leads.lost_at IS 'Timestamp when the lead was marked as LOST';
COMMENT ON COLUMN leads.previously_lost IS 'Flag to indicate if lead was ever marked as LOST before';