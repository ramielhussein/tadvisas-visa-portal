-- Fix RLS policies for all storage buckets to use correct authentication check

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload my-oc files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete my-oc files" ON storage.objects;

-- Recreate policies with correct authentication check
CREATE POLICY "Authenticated users can upload my-oc files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'my-oc-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete my-oc files"
ON storage.objects FOR DELETE
USING (bucket_id = 'my-oc-album' AND auth.uid() IS NOT NULL);

-- Fix all other album buckets
DROP POLICY IF EXISTS "Authenticated users can upload ph-ic files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete ph-ic files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload ph-oc files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete ph-oc files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload id-ic files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete id-ic files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload id-oc files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete id-oc files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload et-ic files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete et-ic files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload et-oc files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete et-oc files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload af-ic files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete af-ic files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload af-oc files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete af-oc files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload my-ic files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete my-ic files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload kenya files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete kenya files" ON storage.objects;

-- Philippines IC
CREATE POLICY "Authenticated users can upload ph-ic files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ph-ic-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete ph-ic files"
ON storage.objects FOR DELETE
USING (bucket_id = 'ph-ic-album' AND auth.uid() IS NOT NULL);

-- Philippines OC
CREATE POLICY "Authenticated users can upload ph-oc files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ph-oc-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete ph-oc files"
ON storage.objects FOR DELETE
USING (bucket_id = 'ph-oc-album' AND auth.uid() IS NOT NULL);

-- Indonesia IC
CREATE POLICY "Authenticated users can upload id-ic files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'id-ic-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete id-ic files"
ON storage.objects FOR DELETE
USING (bucket_id = 'id-ic-album' AND auth.uid() IS NOT NULL);

-- Indonesia OC
CREATE POLICY "Authenticated users can upload id-oc files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'id-oc-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete id-oc files"
ON storage.objects FOR DELETE
USING (bucket_id = 'id-oc-album' AND auth.uid() IS NOT NULL);

-- Ethiopia IC
CREATE POLICY "Authenticated users can upload et-ic files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'et-ic-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete et-ic files"
ON storage.objects FOR DELETE
USING (bucket_id = 'et-ic-album' AND auth.uid() IS NOT NULL);

-- Ethiopia OC
CREATE POLICY "Authenticated users can upload et-oc files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'et-oc-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete et-oc files"
ON storage.objects FOR DELETE
USING (bucket_id = 'et-oc-album' AND auth.uid() IS NOT NULL);

-- Africa IC
CREATE POLICY "Authenticated users can upload af-ic files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'af-ic-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete af-ic files"
ON storage.objects FOR DELETE
USING (bucket_id = 'af-ic-album' AND auth.uid() IS NOT NULL);

-- Africa OC
CREATE POLICY "Authenticated users can upload af-oc files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'af-oc-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete af-oc files"
ON storage.objects FOR DELETE
USING (bucket_id = 'af-oc-album' AND auth.uid() IS NOT NULL);

-- Myanmar IC
CREATE POLICY "Authenticated users can upload my-ic files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'my-ic-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete my-ic files"
ON storage.objects FOR DELETE
USING (bucket_id = 'my-ic-album' AND auth.uid() IS NOT NULL);

-- Kenya
CREATE POLICY "Authenticated users can upload kenya files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'kenya-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete kenya files"
ON storage.objects FOR DELETE
USING (bucket_id = 'kenya-album' AND auth.uid() IS NOT NULL);