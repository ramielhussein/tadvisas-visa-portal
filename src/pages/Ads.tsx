import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, Loader2, Megaphone, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface AdMedia {
  id: string;
  url: string;
  created_at: string;
}

const Ads = () => {
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

  // Fetch ads from storage
  const { data: ads = [], isLoading } = useQuery({
    queryKey: ['ads-album'],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from('ads-album')
        .list('', {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      const adsWithUrls = await Promise.all(
        data.map(async (file) => {
          const { data: urlData } = supabase.storage
            .from('ads-album')
            .getPublicUrl(file.name);

          return {
            id: file.name,
            url: urlData.publicUrl,
            created_at: file.created_at
          };
        })
      );

      return adsWithUrls;
    }
  });

  // Upload ads
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('ads-album')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
      }

      toast({
        title: "Success!",
        description: `${files.length} ad(s) uploaded successfully.`,
      });

      queryClient.invalidateQueries({ queryKey: ['ads-album'] });
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

  // Delete ad
  const deleteMutation = useMutation({
    mutationFn: async (adId: string) => {
      const { error } = await supabase.storage
        .from('ads-album')
        .remove([adId]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Deleted",
        description: "Ad removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['ads-album'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg|mov)$/i);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Megaphone className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold">Running Ads</h1>
              </div>
              <p className="text-muted-foreground">View and manage all currently running advertisements</p>
            </div>
            
            <div className="flex gap-2">
              {isAuthenticated ? (
                <div className="relative">
                  <input
                    type="file"
                    id="ad-upload"
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
                    <label htmlFor="ad-upload" className="cursor-pointer">
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-5 w-5" />
                          Upload Ad
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
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : ads.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Megaphone className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No ads running</p>
                <p className="text-muted-foreground">Upload your first ad to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {ads.map((ad) => (
                <Card key={ad.id} className="overflow-hidden group relative">
                  <CardContent className="p-0">
                    <div className="aspect-square relative">
                      {isVideo(ad.url) ? (
                        <div className="relative w-full h-full">
                          <video
                            src={ad.url}
                            className="w-full h-full object-cover"
                            controls
                          />
                          <div className="absolute top-2 left-2 bg-black/70 rounded-full p-1">
                            <Play className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      ) : (
                        <img
                          src={ad.url}
                          alt="Advertisement"
                          className="w-full h-full object-cover"
                        />
                      )}
                      {isAuthenticated && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => deleteMutation.mutate(ad.id)}
                            disabled={deleteMutation.isPending}
                            className="pointer-events-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground truncate">
                        {ad.id}
                      </p>
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

export default Ads;
