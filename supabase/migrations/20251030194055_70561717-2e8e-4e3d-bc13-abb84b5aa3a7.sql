-- Add comments column to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS comments text;