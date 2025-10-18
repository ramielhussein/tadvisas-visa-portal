import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Photo {
  id: string;
  url: string;
  created_at: string;
}

const IdIc = () => {
  const [uploading, setUploading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch photos from storage
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['id-ic-photos'],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from('id-ic-album')
        .list('', {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      const photosWithUrls = await Promise.all(
        data.map(async (file) => {
          const { data: urlData } = supabase.storage
            .from('id-ic-album')
            .getPublicUrl(file.name);

          return {
            id: file.name,
            url: urlData.publicUrl,
            created_at: file.created_at
          };
        })
      );

      return photosWithUrls;
    }
  });

  // Upload photos
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('id-ic-album')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
      }

      toast({
        title: "Success!",
        description: `${files.length} file(s) uploaded successfully.`,
      });

      queryClient.invalidateQueries({ queryKey: ['id-ic-photos'] });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Delete photo
  const deleteMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await supabase.storage
        .from('id-ic-album')
        .remove([photoId]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Deleted",
        description: "File removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['id-ic-photos'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Indonesia Workers Inside Country</h1>
              <p className="text-muted-foreground">Upload and manage your daily photos and videos</p>
            </div>
            
            {isAuthenticated ? (
              <div className="relative">
                <input
                  type="file"
                  id="photo-upload"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <Button
                  asChild
                  disabled={uploading}
                  size="lg"
                >
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-5 w-5" />
                        Upload Media
                      </>
                    )}
                  </label>
                </Button>
              </div>
            ) : (
              <Button asChild size="lg">
                <Link to="/auth">Login to Upload</Link>
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : photos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Upload className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No media yet</p>
                <p className="text-muted-foreground">Upload your first photos and videos to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden group relative">
                  <CardContent className="p-0">
                    <div className="aspect-square relative">
                      {photo.url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                        <video
                          src={photo.url}
                          className="w-full h-full object-cover"
                          controls
                        />
                      ) : (
                        <img
                          src={photo.url}
                          alt="ID-IC media"
                          className="w-full h-full object-cover"
                        />
                      )}
                      {isAuthenticated && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => deleteMutation.mutate(photo.id)}
                            disabled={deleteMutation.isPending}
                            className="pointer-events-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <Button 
                        asChild
                        className="w-full bg-gradient-primary text-white"
                        size="sm"
                      >
                        <Link to={`/book-worker?photo=${encodeURIComponent(photo.url)}`}>
                          Book This Worker
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default IdIc;
