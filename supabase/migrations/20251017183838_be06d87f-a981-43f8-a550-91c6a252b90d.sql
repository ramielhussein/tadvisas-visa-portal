-- Create RLS policies for start-here-uploads bucket to allow public uploads
CREATE POLICY "Anyone can upload to start-here-uploads"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'start-here-uploads');

CREATE POLICY "Anyone can view start-here-uploads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'start-here-uploads');

CREATE POLICY "Authenticated users can delete from start-here-uploads"
ON storage.objects
FOR DELETE
USING (bucket_id = 'start-here-uploads' AND auth.role() = 'authenticated');