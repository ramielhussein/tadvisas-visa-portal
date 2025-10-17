-- Create storage bucket for AF-OC album
INSERT INTO storage.buckets (id, name, public)
VALUES ('af-oc-album', 'af-oc-album', true);

-- Create storage bucket for AF-IC album
INSERT INTO storage.buckets (id, name, public)
VALUES ('af-ic-album', 'af-ic-album', true);

-- Create RLS policies for AF-OC album
CREATE POLICY "Anyone can view AF-OC media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'af-oc-album');

CREATE POLICY "Authenticated users can upload AF-OC media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'af-oc-album' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete AF-OC media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'af-oc-album' AND auth.role() = 'authenticated');

-- Create RLS policies for AF-IC album
CREATE POLICY "Anyone can view AF-IC media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'af-ic-album');

CREATE POLICY "Authenticated users can upload AF-IC media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'af-ic-album' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete AF-IC media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'af-ic-album' AND auth.role() = 'authenticated');