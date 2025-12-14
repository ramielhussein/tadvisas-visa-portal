DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_roles'
      AND policyname = 'Authenticated users can view user roles'
  ) THEN
    CREATE POLICY "Authenticated users can view user roles"
      ON public.user_roles
      FOR SELECT
      TO authenticated
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;