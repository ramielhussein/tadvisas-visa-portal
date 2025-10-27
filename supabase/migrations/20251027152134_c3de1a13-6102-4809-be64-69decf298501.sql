
-- Drop the old weight check constraint
ALTER TABLE workers DROP CONSTRAINT IF EXISTS workers_weight_kg_check;

-- Add a more reasonable weight constraint (35-200 kg)
ALTER TABLE workers ADD CONSTRAINT workers_weight_kg_check 
  CHECK (weight_kg >= 35 AND weight_kg <= 200);
