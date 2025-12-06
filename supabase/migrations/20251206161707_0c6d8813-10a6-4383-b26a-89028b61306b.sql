-- Create trigger to update bank account balance when payment is recorded
CREATE OR REPLACE FUNCTION public.update_bank_balance_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.bank_account_id IS NOT NULL THEN
      UPDATE bank_accounts
      SET current_balance = current_balance + NEW.amount,
          updated_at = now()
      WHERE id = NEW.bank_account_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.bank_account_id IS NOT NULL THEN
      UPDATE bank_accounts
      SET current_balance = current_balance - OLD.amount,
          updated_at = now()
      WHERE id = OLD.bank_account_id;
    END IF;
    RETURN OLD;
  END IF;

  -- Handle UPDATE (bank account or amount change)
  IF TG_OP = 'UPDATE' THEN
    -- Remove from old bank account if changed
    IF OLD.bank_account_id IS DISTINCT FROM NEW.bank_account_id OR OLD.amount IS DISTINCT FROM NEW.amount THEN
      IF OLD.bank_account_id IS NOT NULL THEN
        UPDATE bank_accounts
        SET current_balance = current_balance - OLD.amount,
            updated_at = now()
        WHERE id = OLD.bank_account_id;
      END IF;
      
      -- Add to new bank account
      IF NEW.bank_account_id IS NOT NULL THEN
        UPDATE bank_accounts
        SET current_balance = current_balance + NEW.amount,
            updated_at = now()
        WHERE id = NEW.bank_account_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- Create trigger for payment balance updates
DROP TRIGGER IF EXISTS update_bank_balance_trigger ON payments;
CREATE TRIGGER update_bank_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_balance_on_payment();