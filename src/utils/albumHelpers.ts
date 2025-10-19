import { supabase } from "@/integrations/supabase/client";

export const checkAdminRole = async (userId: string): Promise<boolean> => {
  const { data: roleData } = await supabase
    .rpc('has_role', { _user_id: userId, _role: 'admin' });
  return !!roleData;
};

export const resetAlbum = async (bucketName: string): Promise<void> => {
  const { data: files, error: listError } = await supabase.storage
    .from(bucketName)
    .list('');

  if (listError) throw listError;

  if (files && files.length > 0) {
    const filePaths = files.map(file => file.name);
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove(filePaths);

    if (deleteError) throw deleteError;
  }
};

export const resetAllAlbums = async (): Promise<void> => {
  const buckets = [
    'ph-ic-album', 'ph-oc-album',
    'id-ic-album', 'id-oc-album',
    'et-ic-album', 'et-oc-album',
    'af-ic-album', 'af-oc-album',
    'my-ic-album', 'my-oc-album',
    'kenya-album'
  ];

  for (const bucket of buckets) {
    try {
      await resetAlbum(bucket);
    } catch (error) {
      console.error(`Error deleting files from ${bucket}:`, error);
    }
  }
};