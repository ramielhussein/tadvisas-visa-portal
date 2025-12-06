-- Create function to check if user can approve deals (sales_manager, admin, super_admin)
CREATE OR REPLACE FUNCTION public.can_approve_deals(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('sales_manager', 'admin', 'super_admin')
  )
$$;

-- Create function to check if user is finance
CREATE OR REPLACE FUNCTION public.is_finance(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('finance', 'admin', 'super_admin')
  )
$$;

-- Update RLS policy for deals - only managers can activate draft deals
DROP POLICY IF EXISTS "Sales managers can activate deals" ON public.deals;
CREATE POLICY "Sales managers can activate deals" 
ON public.deals 
FOR UPDATE 
USING (
  can_approve_deals(auth.uid()) AND status = 'Draft'
)
WITH CHECK (
  can_approve_deals(auth.uid())
);

-- Finance can create contracts for active deals only
DROP POLICY IF EXISTS "Finance can create contracts for active deals" ON public.contracts;
CREATE POLICY "Finance can create contracts for active deals" 
ON public.contracts 
FOR INSERT 
WITH CHECK (
  is_finance(auth.uid())
);

-- Finance can view contracts
DROP POLICY IF EXISTS "Finance can view contracts" ON public.contracts;
CREATE POLICY "Finance can view contracts" 
ON public.contracts 
FOR SELECT 
USING (
  is_finance(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)
);