-- Create storage bucket for start-here uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('start-here-uploads', 'start-here-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can upload to start-here" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view start-here files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete start-here files" ON storage.objects;

-- Allow anyone to upload files
CREATE POLICY "Anyone can upload to start-here"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'start-here-uploads');

-- Allow anyone to view files
CREATE POLICY "Anyone can view start-here files"
ON storage.objects FOR SELECT
USING (bucket_id = 'start-here-uploads');

-- Allow anyone to delete their uploads
CREATE POLICY "Anyone can delete start-here files"
ON storage.objects FOR DELETE
USING (bucket_id = 'start-here-uploads');