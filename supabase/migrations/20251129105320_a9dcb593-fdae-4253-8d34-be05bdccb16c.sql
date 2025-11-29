-- Ensure sequence exists and is correctly positioned for deal_number generation
DO $$
DECLARE
  max_num integer;
BEGIN
  -- Find current maximum numeric suffix of existing deal numbers
  SELECT COALESCE(MAX(CAST(SUBSTRING(deal_number FROM 6) AS INTEGER)), 0)
  INTO max_num
  FROM public.deals
  WHERE deal_number LIKE 'DEAL-%';

  -- Create sequence if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'deal_number_seq'
  ) THEN
    EXECUTE format('CREATE SEQUENCE public.deal_number_seq START WITH %s', max_num + 1);
  ELSE
    -- Align existing sequence with current max so we don't generate duplicates
    PERFORM setval('public.deal_number_seq', max_num, true);
  END IF;
END $$;

-- Make deal number generation use the sequence to avoid race-condition duplicates
CREATE OR REPLACE FUNCTION public.generate_deal_number()
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
  next_number := nextval('public.deal_number_seq');

  RETURN 'DEAL-' || year_prefix || LPAD(next_number::TEXT, 4, '0');
END;
$function$;