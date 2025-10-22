-- Add new columns to submissions table for unified form handling
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS emirates_id_front_url TEXT,
ADD COLUMN IF NOT EXISTS emirates_id_back_url TEXT,
ADD COLUMN IF NOT EXISTS worker_photo_url TEXT;

-- Make package nullable since worker bookings don't have packages
ALTER TABLE public.submissions 
ALTER COLUMN package DROP NOT NULL;

-- Migrate existing emirates_id_url data to emirates_id_front_url
UPDATE public.submissions 
SET emirates_id_front_url = emirates_id_url 
WHERE emirates_id_url IS NOT NULL AND emirates_id_front_url IS NULL;

-- Drop the old single emirates_id_url column
ALTER TABLE public.submissions 
DROP COLUMN IF EXISTS emirates_id_url;

-- Drop the bookings table since we're consolidating into submissions
DROP TABLE IF EXISTS public.bookings;