-- Add reduces_balance column to payments table
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS reduces_balance boolean NOT NULL DEFAULT true;

-- Update the trigger to respect reduces_balance flag
CREATE OR REPLACE FUNCTION public.update_deal_paid_amount()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Handle INSERT: Add the new payment amount to existing paid_amount only if reduces_balance is true
  IF TG_OP = 'INSERT' THEN
    IF NEW.deal_id IS NOT NULL AND NEW.reduces_balance = true THEN
      UPDATE deals
      SET 
        paid_amount = COALESCE(paid_amount, 0) + NEW.amount,
        updated_at = now()
      WHERE id = NEW.deal_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle DELETE: Subtract the deleted payment amount from paid_amount only if it was reducing balance
  IF TG_OP = 'DELETE' THEN
    IF OLD.deal_id IS NOT NULL AND OLD.reduces_balance = true THEN
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
    -- If deal_id changed or reduces_balance changed
    IF OLD.deal_id IS DISTINCT FROM NEW.deal_id OR OLD.reduces_balance IS DISTINCT FROM NEW.reduces_balance OR OLD.amount IS DISTINCT FROM NEW.amount THEN
      -- Remove from old deal if it was reducing balance
      IF OLD.deal_id IS NOT NULL AND OLD.reduces_balance = true THEN
        UPDATE deals
        SET 
          paid_amount = GREATEST(COALESCE(paid_amount, 0) - OLD.amount, 0),
          updated_at = now()
        WHERE id = OLD.deal_id;
      END IF;
      
      -- Add to new deal if it should reduce balance
      IF NEW.deal_id IS NOT NULL AND NEW.reduces_balance = true THEN
        UPDATE deals
        SET 
          paid_amount = COALESCE(paid_amount, 0) + NEW.amount,
          updated_at = now()
        WHERE id = NEW.deal_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$function$;

-- Drop old trigger if exists and create new one using the correct function
DROP TRIGGER IF EXISTS update_deal_on_payment_trigger ON public.payments;
DROP TRIGGER IF EXISTS update_deal_paid_amount_trigger ON public.payments;

CREATE TRIGGER update_deal_paid_amount_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_deal_paid_amount();

-- Add index for the new column
CREATE INDEX IF NOT EXISTS idx_payments_reduces_balance ON public.payments(reduces_balance);