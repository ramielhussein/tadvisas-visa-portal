import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface File {
  id: string;
  url: string;
  created_at: string;
}

const StartHere = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch files from storage
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['start-here-files'],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from('start-here-uploads')
        .list('', {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      const filesWithUrls = await Promise.all(
        data.map(async (file) => {
          const { data: urlData } = supabase.storage
            .from('start-here-uploads')
            .getPublicUrl(file.name);

          return {
            id: file.name,
            url: urlData.publicUrl,
            created_at: file.created_at
          };
        })
      );

      return filesWithUrls;
    }
  });

  // Upload files
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadFiles = e.target.files;
    if (!uploadFiles || uploadFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(uploadFiles)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('start-here-uploads')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
      }

      toast({
        title: "Success!",
        description: `${uploadFiles.length} file(s) uploaded successfully.`,
      });

      queryClient.invalidateQueries({ queryKey: ['start-here-files'] });
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

  // Delete file
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const { error } = await supabase.storage
        .from('start-here-uploads')
        .remove([fileId]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Deleted",
        description: "File removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['start-here-files'] });
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
              <h1 className="text-4xl font-bold mb-2">START HERE & NOW</h1>
              <p className="text-muted-foreground">Upload your documents and files to get started</p>
            </div>
            
            <div className="relative">
              <input
                type="file"
                id="file-upload"
                multiple
                accept="*/*"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
              <Button
                asChild
                disabled={uploading}
                size="lg"
              >
                <label htmlFor="file-upload" className="cursor-pointer">
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-5 w-5" />
                      Upload Files
                    </>
                  )}
                </label>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Upload className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No files yet</p>
                <p className="text-muted-foreground">Upload your first documents to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((file) => (
                <Card key={file.id} className="overflow-hidden group relative">
                  <CardContent className="p-0">
                    <div className="aspect-square relative">
                      {file.url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                        <video
                          src={file.url}
                          className="w-full h-full object-cover"
                          controls
                        />
                      ) : file.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img
                          src={file.url}
                          alt="Uploaded file"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <div className="text-center p-4">
                            <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground break-all">{file.id}</p>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => deleteMutation.mutate(file.id)}
                          disabled={deleteMutation.isPending}
                          className="pointer-events-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

export default StartHere;