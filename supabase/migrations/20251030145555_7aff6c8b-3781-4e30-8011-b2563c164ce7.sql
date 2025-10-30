-- Add new status values to lead_status enum
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'Called No Answer';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'Called Engaged';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'Called COLD';