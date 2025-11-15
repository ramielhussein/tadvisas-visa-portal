-- Add deal_id column to payments table to track payments against deals
ALTER TABLE payments 
ADD COLUMN deal_id uuid REFERENCES deals(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_payments_deal_id ON payments(deal_id);

-- Add check constraint to ensure either invoice_id or deal_id is present
ALTER TABLE payments 
ADD CONSTRAINT payments_reference_check 
CHECK (invoice_id IS NOT NULL OR deal_id IS NOT NULL);

-- Add calculated columns to deals for payment tracking
ALTER TABLE deals
ADD COLUMN paid_amount numeric DEFAULT 0 NOT NULL,
ADD COLUMN balance_due numeric GENERATED ALWAYS AS (total_amount - paid_amount) STORED;

-- Create function to update deal paid_amount when payment is made
CREATE OR REPLACE FUNCTION update_deal_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_deal_id uuid;
BEGIN
  -- Get the deal_id from NEW or OLD depending on operation
  IF TG_OP = 'DELETE' THEN
    target_deal_id := OLD.deal_id;
  ELSE
    target_deal_id := NEW.deal_id;
  END IF;

  -- Skip if no deal_id
  IF target_deal_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Update the deal paid_amount
  UPDATE deals
  SET 
    paid_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM payments
      WHERE deal_id = target_deal_id
    )
  WHERE id = target_deal_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to auto-update deal when payment is recorded
CREATE TRIGGER trigger_update_deal_on_payment
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_deal_on_payment();