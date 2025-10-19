-- Create storage bucket for Myanmar workers outside country
INSERT INTO storage.buckets (id, name, public)
VALUES ('my-oc-album', 'my-oc-album', true);

-- Create policy to allow anyone to view files
CREATE POLICY "Anyone can view my-oc files"
ON storage.objects FOR SELECT
USING (bucket_id = 'my-oc-album');

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload my-oc files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'my-oc-album' AND auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete my-oc files"
ON storage.objects FOR DELETE
USING (bucket_id = 'my-oc-album' AND auth.role() = 'authenticated');