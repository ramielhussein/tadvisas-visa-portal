-- Add new status values to lead_status enum
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'Called Unanswer 2';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'No Connection';