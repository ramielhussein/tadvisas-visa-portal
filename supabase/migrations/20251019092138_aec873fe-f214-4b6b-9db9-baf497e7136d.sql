-- Remove Kenya album storage bucket and its policies
DROP POLICY IF EXISTS "Anyone can view kenya files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload kenya files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete kenya files" ON storage.objects;

DELETE FROM storage.buckets WHERE id = 'kenya-album';