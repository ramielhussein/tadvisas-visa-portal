-- Create policy to allow public read access (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public Access kenya-album'
  ) THEN
    CREATE POLICY "Public Access kenya-album"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'kenya-album');
  END IF;
END $$;

-- Create policy to allow anyone to upload
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow uploads kenya-album'
  ) THEN
    CREATE POLICY "Allow uploads kenya-album"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'kenya-album');
  END IF;
END $$;

-- Create policy to allow anyone to delete
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow deletes kenya-album'
  ) THEN
    CREATE POLICY "Allow deletes kenya-album"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'kenya-album');
  END IF;
END $$;