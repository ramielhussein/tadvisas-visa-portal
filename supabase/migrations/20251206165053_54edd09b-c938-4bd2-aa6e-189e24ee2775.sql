-- Reset deal number sequence to start fresh from 1
ALTER SEQUENCE public.deal_number_seq RESTART WITH 1;

-- Update generate_deal_number to use simpler 4-digit format
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
  
  -- Get max number from existing deals for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(deal_number FROM 8) AS INTEGER)), 0) + 1
  INTO next_number
  FROM deals
  WHERE deal_number LIKE 'DEAL-' || year_prefix || '%'
    AND LENGTH(deal_number) = 11; -- DEAL-25XXXX format (11 chars)
  
  new_deal_number := 'DEAL-' || year_prefix || LPAD(next_number::TEXT, 4, '0');
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM deals WHERE deal_number = new_deal_number) LOOP
    next_number := next_number + 1;
    new_deal_number := 'DEAL-' || year_prefix || LPAD(next_number::TEXT, 4, '0');
  END LOOP;
  
  RETURN new_deal_number;
END;
$function$;

-- Also fix contract number function - SUBSTRING should be FROM 6 not FROM 5
CREATE OR REPLACE FUNCTION public.generate_contract_number()
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
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM 6) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.contracts
  WHERE contract_number LIKE 'CONT-' || year_prefix || '%'
    AND LENGTH(contract_number) = 10; -- CONT-25XXXX format (10 chars)
  
  RETURN 'CONT-' || year_prefix || LPAD(next_number::TEXT, 4, '0');
END;
$function$;