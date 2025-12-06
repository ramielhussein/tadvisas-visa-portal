-- Update generate_deal_number to use YYMM0001 format
CREATE OR REPLACE FUNCTION public.generate_deal_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
  year_month_prefix TEXT;
  new_deal_number TEXT;
BEGIN
  -- Format: YYMM (e.g., 2512 for December 2025)
  year_month_prefix := TO_CHAR(CURRENT_DATE, 'YYMM');
  
  -- Get max number from existing deals for this month
  SELECT COALESCE(MAX(CAST(SUBSTRING(deal_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM deals
  WHERE deal_number LIKE year_month_prefix || '%'
    AND LENGTH(deal_number) = 8; -- YYMM0001 format (8 chars)
  
  new_deal_number := year_month_prefix || LPAD(next_number::TEXT, 4, '0');
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM deals WHERE deal_number = new_deal_number) LOOP
    next_number := next_number + 1;
    new_deal_number := year_month_prefix || LPAD(next_number::TEXT, 4, '0');
  END LOOP;
  
  RETURN new_deal_number;
END;
$function$;

-- Also update contract numbering to same format YYMM0001
CREATE OR REPLACE FUNCTION public.generate_contract_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
  year_month_prefix TEXT;
  new_contract_number TEXT;
BEGIN
  -- Format: YYMM (e.g., 2512 for December 2025)
  year_month_prefix := TO_CHAR(CURRENT_DATE, 'YYMM');
  
  -- Get max number from existing contracts for this month
  SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM contracts
  WHERE contract_number LIKE year_month_prefix || '%'
    AND LENGTH(contract_number) = 8; -- YYMM0001 format (8 chars)
  
  new_contract_number := year_month_prefix || LPAD(next_number::TEXT, 4, '0');
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM contracts WHERE contract_number = new_contract_number) LOOP
    next_number := next_number + 1;
    new_contract_number := year_month_prefix || LPAD(next_number::TEXT, 4, '0');
  END LOOP;
  
  RETURN new_contract_number;
END;
$function$;