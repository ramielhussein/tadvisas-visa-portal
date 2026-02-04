import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMindMap, MindMap } from '@/hooks/useMindMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Trash2,
  FileText,
  Calendar,
  Loader2,
  Brain,
} from 'lucide-react';
import { format } from 'date-fns';
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
} from '@/components/ui/alert-dialog';

const MindMapList = () => {
  const { maps, fetchMaps, createMap, deleteMap, isLoading } = useMindMap();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMaps();
  }, [fetchMaps]);

  const handleCreateMap = async () => {
    const newMap = await createMap();
    if (newMap) {
      navigate(`/mindmap/${newMap.id}`);
    }
  };

  const handleOpenMap = (mapId: string) => {
    navigate(`/mindmap/${mapId}`);
  };

  const handleDeleteMap = async (mapId: string) => {
    await deleteMap(mapId);
  };

  if (isLoading && maps.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mind Maps</h1>
            <p className="text-muted-foreground">
              Create, organize, and collaborate on visual ideas
            </p>
          </div>
        </div>
        <Button onClick={handleCreateMap} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          New Mind Map
        </Button>
      </div>

      {maps.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <FileText className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No mind maps yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-sm">
              Create your first mind map to start brainstorming and organizing your ideas visually.
            </p>
            <Button onClick={handleCreateMap} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Mind Map
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {maps.map((map: MindMap) => (
            <Card
              key={map.id}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleOpenMap(map.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">
                    {map.title || 'Untitled Mind Map'}
                  </CardTitle>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Mind Map</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{map.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMap(map.id);
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(map.updated_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {map.is_shared && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Shared
                    </span>
                  )}
                </div>
                {map.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {map.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MindMapList;
