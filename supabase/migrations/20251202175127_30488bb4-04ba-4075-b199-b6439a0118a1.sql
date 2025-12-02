-- Add 'Internal' to the transfer_type enum
ALTER TYPE public.transfer_type ADD VALUE IF NOT EXISTS 'Internal';