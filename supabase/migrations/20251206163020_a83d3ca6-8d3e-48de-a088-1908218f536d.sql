-- Add acquisition costs field to workers table for tracking worker-level costs
ALTER TABLE public.workers 
ADD COLUMN IF NOT EXISTS acquisition_costs jsonb DEFAULT '[]'::jsonb;

-- Example structure: 
-- [
--   {"category": "agent_fee", "amount": 5000, "description": "Agent recruitment fee"},
--   {"category": "initial_visa", "amount": 1200, "description": "Entry visa"},
--   {"category": "medical", "amount": 300, "description": "Initial medical checkup"}
-- ]

COMMENT ON COLUMN public.workers.acquisition_costs IS 'Array of worker acquisition costs that can be auto-populated into deals';