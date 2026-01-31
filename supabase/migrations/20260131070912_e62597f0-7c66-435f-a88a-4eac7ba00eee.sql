
-- Update the trigger function to use incremental updates instead of recalculating the sum
-- This preserves any manually adjusted paid_amount values
CREATE OR REPLACE FUNCTION public.update_deal_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT: Add the new payment amount to existing paid_amount
  IF TG_OP = 'INSERT' THEN
    IF NEW.deal_id IS NOT NULL THEN
      UPDATE deals
      SET 
        paid_amount = COALESCE(paid_amount, 0) + NEW.amount,
        updated_at = now()
      WHERE id = NEW.deal_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle DELETE: Subtract the deleted payment amount from paid_amount
  IF TG_OP = 'DELETE' THEN
    IF OLD.deal_id IS NOT NULL THEN
      UPDATE deals
      SET 
        paid_amount = GREATEST(COALESCE(paid_amount, 0) - OLD.amount, 0),
        updated_at = now()
      WHERE id = OLD.deal_id;
    END IF;
    RETURN OLD;
  END IF;

  -- Handle UPDATE: Adjust for the difference between old and new amounts
  IF TG_OP = 'UPDATE' THEN
    -- If deal_id changed, subtract from old deal and add to new deal
    IF OLD.deal_id IS DISTINCT FROM NEW.deal_id THEN
      -- Remove from old deal
      IF OLD.deal_id IS NOT NULL THEN
        UPDATE deals
        SET 
          paid_amount = GREATEST(COALESCE(paid_amount, 0) - OLD.amount, 0),
          updated_at = now()
        WHERE id = OLD.deal_id;
      END IF;
      
      -- Add to new deal
      IF NEW.deal_id IS NOT NULL THEN
        UPDATE deals
        SET 
          paid_amount = COALESCE(paid_amount, 0) + NEW.amount,
          updated_at = now()
        WHERE id = NEW.deal_id;
      END IF;
    -- If same deal but amount changed, adjust by the difference
    ELSIF OLD.amount IS DISTINCT FROM NEW.amount THEN
      IF NEW.deal_id IS NOT NULL THEN
        UPDATE deals
        SET 
          paid_amount = GREATEST(COALESCE(paid_amount, 0) - OLD.amount + NEW.amount, 0),
          updated_at = now()
        WHERE id = NEW.deal_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
