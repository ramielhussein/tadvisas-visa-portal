-- Add permissions column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{
  "cv": {"create": false, "edit": false, "delete": false},
  "refund": {"create": false},
  "leads": {"create": false, "assign": false}
}'::jsonb;

-- Add full_name column to profiles for display purposes
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name text;

-- Update RLS policy to allow admins to update any profile
CREATE POLICY "Admins can update any profile" 
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));