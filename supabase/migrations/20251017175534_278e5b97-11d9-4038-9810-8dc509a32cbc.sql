-- Drop all existing policies for our buckets first
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname LIKE '%kenya-album%'
           OR policyname LIKE '%id-oc-album%'
           OR policyname LIKE '%id-ic-album%'
           OR policyname LIKE '%ph-ic-album%'
           OR policyname LIKE '%ph-oc-album%'
           OR policyname LIKE '%et-ic-album%'
           OR policyname LIKE '%et-oc-album%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    END LOOP;
END $$;

-- Kenya album policies
CREATE POLICY "Public can view kenya-album"
ON storage.objects FOR SELECT
USING (bucket_id = 'kenya-album');

CREATE POLICY "Authenticated users can upload to kenya-album"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'kenya-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete from kenya-album"
ON storage.objects FOR DELETE
USING (bucket_id = 'kenya-album' AND auth.uid() IS NOT NULL);

-- ID-OC album policies
CREATE POLICY "Public can view id-oc-album"
ON storage.objects FOR SELECT
USING (bucket_id = 'id-oc-album');

CREATE POLICY "Authenticated users can upload to id-oc-album"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'id-oc-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete from id-oc-album"
ON storage.objects FOR DELETE
USING (bucket_id = 'id-oc-album' AND auth.uid() IS NOT NULL);

-- ID-IC album policies
CREATE POLICY "Public can view id-ic-album"
ON storage.objects FOR SELECT
USING (bucket_id = 'id-ic-album');

CREATE POLICY "Authenticated users can upload to id-ic-album"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'id-ic-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete from id-ic-album"
ON storage.objects FOR DELETE
USING (bucket_id = 'id-ic-album' AND auth.uid() IS NOT NULL);

-- PH-IC album policies
CREATE POLICY "Public can view ph-ic-album"
ON storage.objects FOR SELECT
USING (bucket_id = 'ph-ic-album');

CREATE POLICY "Authenticated users can upload to ph-ic-album"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ph-ic-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete from ph-ic-album"
ON storage.objects FOR DELETE
USING (bucket_id = 'ph-ic-album' AND auth.uid() IS NOT NULL);

-- PH-OC album policies
CREATE POLICY "Public can view ph-oc-album"
ON storage.objects FOR SELECT
USING (bucket_id = 'ph-oc-album');

CREATE POLICY "Authenticated users can upload to ph-oc-album"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ph-oc-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete from ph-oc-album"
ON storage.objects FOR DELETE
USING (bucket_id = 'ph-oc-album' AND auth.uid() IS NOT NULL);

-- ET-IC album policies
CREATE POLICY "Public can view et-ic-album"
ON storage.objects FOR SELECT
USING (bucket_id = 'et-ic-album');

CREATE POLICY "Authenticated users can upload to et-ic-album"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'et-ic-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete from et-ic-album"
ON storage.objects FOR DELETE
USING (bucket_id = 'et-ic-album' AND auth.uid() IS NOT NULL);

-- ET-OC album policies
CREATE POLICY "Public can view et-oc-album"
ON storage.objects FOR SELECT
USING (bucket_id = 'et-oc-album');

CREATE POLICY "Authenticated users can upload to et-oc-album"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'et-oc-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete from et-oc-album"
ON storage.objects FOR DELETE
USING (bucket_id = 'et-oc-album' AND auth.uid() IS NOT NULL);