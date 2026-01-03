-- Fix 1: Allow all authenticated users to view payment methods
DROP POLICY IF EXISTS "Admins can view payment methods" ON public.payment_methods;
CREATE POLICY "Authenticated users can view payment methods" 
ON public.payment_methods 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix 2: Allow all authenticated users to view bank accounts
DROP POLICY IF EXISTS "Admins can view all bank accounts" ON public.bank_accounts;
CREATE POLICY "Authenticated users can view bank accounts" 
ON public.bank_accounts 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix 3: Allow salespeople to insert deals (assigned_to must be set to their own id)
DROP POLICY IF EXISTS "Admins can insert deals" ON public.deals;
CREATE POLICY "Authenticated users can create deals" 
ON public.deals 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = assigned_to);