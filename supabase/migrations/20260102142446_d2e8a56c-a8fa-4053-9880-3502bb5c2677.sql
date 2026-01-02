-- Create storage bucket for ads
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads-album', 'ads-album', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for ads bucket
CREATE POLICY "Anyone can view ads" ON storage.objects FOR SELECT USING (bucket_id = 'ads-album');

CREATE POLICY "Authenticated users can upload ads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ads-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete ads" ON storage.objects FOR DELETE USING (bucket_id = 'ads-album' AND auth.uid() IS NOT NULL);