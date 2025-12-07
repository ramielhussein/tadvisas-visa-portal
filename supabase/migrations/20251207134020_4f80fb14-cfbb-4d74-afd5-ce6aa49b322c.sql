-- Create function to update deal paid_amount when payments are inserted/updated/deleted
CREATE OR REPLACE FUNCTION public.update_deal_paid_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deal_id_to_update uuid;
  total_paid numeric;
BEGIN
  -- Determine which deal to update
  IF TG_OP = 'DELETE' THEN
    deal_id_to_update := OLD.deal_id;
  ELSE
    deal_id_to_update := NEW.deal_id;
  END IF;

  -- Only proceed if deal_id is not null
  IF deal_id_to_update IS NOT NULL THEN
    -- Calculate total paid amount for this deal
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM payments
    WHERE deal_id = deal_id_to_update;

    -- Update only paid_amount (balance_due is auto-calculated)
    UPDATE deals
    SET paid_amount = total_paid,
        updated_at = now()
    WHERE id = deal_id_to_update;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for payment inserts
CREATE TRIGGER update_deal_on_payment_insert
AFTER INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION update_deal_paid_amount();

-- Create trigger for payment updates
CREATE TRIGGER update_deal_on_payment_update
AFTER UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_deal_paid_amount();

-- Create trigger for payment deletes
CREATE TRIGGER update_deal_on_payment_delete
AFTER DELETE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_deal_paid_amount();