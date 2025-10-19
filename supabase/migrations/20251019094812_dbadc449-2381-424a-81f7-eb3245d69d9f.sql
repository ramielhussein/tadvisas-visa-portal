-- Add SELECT policy for my-ic-album bucket
CREATE POLICY "Anyone can view my-ic files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'my-ic-album');