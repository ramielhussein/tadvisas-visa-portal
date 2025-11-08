import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Photo {
  id: string;
  url: string;
  created_at: string;
}

const MyOc = () => {
  const [uploading, setUploading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [resetting, setResetting] = useState(false);
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

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['my-oc-photos'],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from('my-oc-album')
        .list('', {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      const photosWithUrls = await Promise.all(
        data.map(async (file) => {
          const { data: urlData } = supabase.storage
            .from('my-oc-album')
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('my-oc-album')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
      }

      toast({
        title: "Success!",
        description: `${files.length} file(s) uploaded successfully.`,
      });

      queryClient.invalidateQueries({ queryKey: ['my-oc-photos'] });
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

  const deleteMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await supabase.storage
        .from('my-oc-album')
        .remove([photoId]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Deleted",
        description: "File removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['my-oc-photos'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleResetAllAlbums = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please login to reset albums.",
        variant: "destructive",
      });
      return;
    }

    setResetting(true);
    const buckets = [
      'ph-ic-album', 'ph-oc-album',
      'id-ic-album', 'id-oc-album',
      'et-ic-album', 'et-oc-album',
      'af-ic-album', 'af-oc-album',
      'my-ic-album', 'my-oc-album',
      'kenya-album'
    ];

    try {
      for (const bucket of buckets) {
        const { data: files, error: listError } = await supabase.storage
          .from(bucket)
          .list('');

        if (listError) {
          console.error(`Error listing files in ${bucket}:`, listError);
          continue;
        }

        if (files && files.length > 0) {
          const filePaths = files.map(file => file.name);
          const { error: deleteError } = await supabase.storage
            .from(bucket)
            .remove(filePaths);

          if (deleteError) {
            console.error(`Error deleting files from ${bucket}:`, deleteError);
          }
        }
      }

      toast({
        title: "Success!",
        description: "All albums have been reset.",
      });

      queryClient.invalidateQueries();
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Myanmar / India Workers Outside Country</h1>
              <p className="text-muted-foreground">Upload and manage your daily photos and videos</p>
            </div>
            
            <div className="flex gap-2">
              {isAuthenticated && (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="lg"
                        disabled={resetting}
                      >
                        {resetting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Resetting...
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="mr-2 h-5 w-5" />
                            RESET ALBUMS
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete all photos and videos from ALL albums.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetAllAlbums}>
                          Yes, delete everything
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

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
                </>
              )}
              {!isAuthenticated && (
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
                          alt="MY-OC media"
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

export default MyOc;