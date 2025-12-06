-- Create function to update deal paid_amount when payments are inserted/updated/deleted
CREATE OR REPLACE FUNCTION update_deal_paid_amount()
RETURNS TRIGGER AS $$
DECLARE
  target_deal_id uuid;
  new_paid_amount numeric;
BEGIN
  -- Determine which deal to update
  IF TG_OP = 'DELETE' THEN
    target_deal_id := OLD.deal_id;
  ELSE
    target_deal_id := NEW.deal_id;
  END IF;
  
  -- Skip if no deal_id
  IF target_deal_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Calculate total paid from all payments for this deal
  SELECT COALESCE(SUM(amount), 0) INTO new_paid_amount
  FROM payments
  WHERE deal_id = target_deal_id;
  
  -- Update the deal's paid_amount and balance_due
  UPDATE deals
  SET 
    paid_amount = new_paid_amount,
    balance_due = total_amount - new_paid_amount,
    updated_at = now()
  WHERE id = target_deal_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on payments table
DROP TRIGGER IF EXISTS trigger_update_deal_paid_amount ON payments;
CREATE TRIGGER trigger_update_deal_paid_amount
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_paid_amount();