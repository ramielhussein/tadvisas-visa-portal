-- Create a sequence for transfer numbers
CREATE SEQUENCE IF NOT EXISTS public.transfer_number_seq START 1;

-- Get current max number to set sequence correctly
DO $$
DECLARE
  max_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(transfer_number FROM 8) AS INTEGER)), 0)
  INTO max_num
  FROM public.worker_transfers
  WHERE transfer_number LIKE 'TRF-%';
  
  IF max_num > 0 THEN
    PERFORM setval('public.transfer_number_seq', max_num);
  END IF;
END $$;

-- Update the function to use sequence instead of MAX
CREATE OR REPLACE FUNCTION public.generate_transfer_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
  year_prefix TEXT;
BEGIN
  year_prefix := TO_CHAR(CURRENT_DATE, 'YY');
  next_number := nextval('public.transfer_number_seq');
  RETURN 'TRF-' || year_prefix || LPAD(next_number::TEXT, 4, '0');
END;
$function$;