-- Add hot flag to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS hot boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN leads.hot IS 'Flag to mark high-priority/hot leads';