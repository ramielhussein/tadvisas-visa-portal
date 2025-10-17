-- Create the kenya-album storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('kenya-album', 'kenya-album', true);

-- Create policy to allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'kenya-album');

-- Create policy to allow anyone to upload
CREATE POLICY "Allow uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'kenya-album');

-- Create policy to allow anyone to delete
CREATE POLICY "Allow deletes"
ON storage.objects FOR DELETE
USING (bucket_id = 'kenya-album');