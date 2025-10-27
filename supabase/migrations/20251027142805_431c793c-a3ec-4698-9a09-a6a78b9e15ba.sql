-- Add RLS policies to allow CV creators to view and edit their own CVs

-- Allow users to view CVs they created
CREATE POLICY "Users can view their own CVs"
  ON public.workers
  FOR SELECT
  USING (auth.uid() = created_by);

-- Allow users to update CVs they created (only if not yet approved/sold)
CREATE POLICY "Users can update their own pending CVs"
  ON public.workers
  FOR UPDATE
  USING (
    auth.uid() = created_by 
    AND status NOT IN ('Sold', 'Reserved')
  );

-- Note: Users already have permission to create CVs via existing INSERT policies