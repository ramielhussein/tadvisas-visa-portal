-- Make 'cvs' bucket public
UPDATE storage.buckets SET public = true WHERE id = 'cvs';

-- Allow public read of objects in 'cvs' bucket
CREATE POLICY "Public can view cvs files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'cvs');