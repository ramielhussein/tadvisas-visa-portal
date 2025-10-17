-- Create storage buckets for all photo albums
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('id-oc-album', 'id-oc-album', true),
  ('id-ic-album', 'id-ic-album', true),
  ('ph-ic-album', 'ph-ic-album', true),
  ('ph-oc-album', 'ph-oc-album', true),
  ('et-ic-album', 'et-ic-album', true),
  ('et-oc-album', 'et-oc-album', true)
ON CONFLICT (id) DO NOTHING;