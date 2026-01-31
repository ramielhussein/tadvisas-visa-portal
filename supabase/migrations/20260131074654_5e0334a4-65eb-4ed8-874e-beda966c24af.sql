-- Remove duplicate/legacy triggers that were updating deals.paid_amount multiple times per payment

-- Drop legacy SUM-based trigger
DROP TRIGGER IF EXISTS trigger_update_deal_on_payment ON public.payments;

-- Drop duplicate incremental triggers (keep a single canonical trigger)
DROP TRIGGER IF EXISTS trigger_update_deal_paid_amount ON public.payments;
DROP TRIGGER IF EXISTS update_deal_on_payment_insert ON public.payments;
DROP TRIGGER IF EXISTS update_deal_on_payment_update ON public.payments;
DROP TRIGGER IF EXISTS update_deal_on_payment_delete ON public.payments;
DROP TRIGGER IF EXISTS update_deal_paid_amount_trigger ON public.payments;
DROP TRIGGER IF EXISTS trigger_update_deal_paid_amount ON public.payments;

-- Recreate a single trigger for incremental paid_amount updates
CREATE TRIGGER update_deal_paid_amount_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_deal_paid_amount();

-- Drop legacy function if no longer referenced
DROP FUNCTION IF EXISTS public.update_deal_on_payment();