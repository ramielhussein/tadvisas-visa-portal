-- Drop the constraint first (it doesn't exist yet, but just to be safe)
ALTER TABLE public.workers DROP CONSTRAINT IF EXISTS workers_status_check;

-- Don't add a constraint yet, let's allow flexible status values for now
-- We can add it later once all statuses are standardized