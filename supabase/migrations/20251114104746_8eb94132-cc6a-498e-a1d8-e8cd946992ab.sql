-- Create a security definer function to check if a phone number exists
-- This bypasses RLS policies to accurately detect duplicates
CREATE OR REPLACE FUNCTION public.check_phone_exists(phone_number text)
RETURNS TABLE (
  phone_exists boolean,
  lead_id uuid,
  client_name text,
  assigned_to uuid,
  archived boolean,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true as phone_exists,
    l.id as lead_id,
    l.client_name,
    l.assigned_to,
    l.archived,
    l.status::text
  FROM leads l
  WHERE l.mobile_number = phone_number
  LIMIT 1;
  
  -- If no rows returned, return a false row
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, null::uuid, null::text, null::uuid, null::boolean, null::text;
  END IF;
END;
$$;