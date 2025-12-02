-- Add worker_p4 to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'worker_p4';