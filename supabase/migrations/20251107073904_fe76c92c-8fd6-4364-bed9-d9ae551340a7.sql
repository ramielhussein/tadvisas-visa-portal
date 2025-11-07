-- Change age column to date_of_birth in workers table
ALTER TABLE public.workers 
DROP COLUMN IF EXISTS age;

ALTER TABLE public.workers 
ADD COLUMN date_of_birth DATE;