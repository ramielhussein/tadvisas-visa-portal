-- Extend the app_role enum to include all role types
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'product';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';

-- Add comment to explain roles
COMMENT ON TYPE public.app_role IS 'User roles: admin (full access), sales (CRM/leads), finance (accounting), product (operations), client (read-only portal), user (basic access)';
