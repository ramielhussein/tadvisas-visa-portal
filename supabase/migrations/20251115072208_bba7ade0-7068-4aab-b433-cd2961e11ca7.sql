-- Enable RLS for chat messages and add policies for authenticated users
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all chat messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'chat_messages' AND policyname = 'Authenticated can read chat messages'
  ) THEN
    CREATE POLICY "Authenticated can read chat messages"
    ON public.chat_messages
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END$$;

-- Allow authenticated users to insert their own chat messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'chat_messages' AND policyname = 'Authenticated can insert own chat messages'
  ) THEN
    CREATE POLICY "Authenticated can insert own chat messages"
    ON public.chat_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- Allow users to update their own chat messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'chat_messages' AND policyname = 'Users can update own chat messages'
  ) THEN
    CREATE POLICY "Users can update own chat messages"
    ON public.chat_messages
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END$$;

-- Allow users to delete their own chat messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'chat_messages' AND policyname = 'Users can delete own chat messages'
  ) THEN
    CREATE POLICY "Users can delete own chat messages"
    ON public.chat_messages
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END$$;

-- Ensure realtime works reliably
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
  END;
END$$;