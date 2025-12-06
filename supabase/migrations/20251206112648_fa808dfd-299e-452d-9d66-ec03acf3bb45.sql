-- Drop and recreate the function to use a more robust unique identifier
CREATE OR REPLACE FUNCTION public.generate_deal_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
  year_prefix TEXT;
  new_deal_number TEXT;
BEGIN
  year_prefix := TO_CHAR(CURRENT_DATE, 'YY');
  
  -- Loop until we get a unique deal number
  LOOP
    next_number := nextval('public.deal_number_seq');
    new_deal_number := 'DEAL-' || year_prefix || LPAD(next_number::TEXT, 6, '0');
    
    -- Check if this number already exists
    IF NOT EXISTS (SELECT 1 FROM deals WHERE deal_number = new_deal_number) THEN
      RETURN new_deal_number;
    END IF;
  END LOOP;
END;
$function$;