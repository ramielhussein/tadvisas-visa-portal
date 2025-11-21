import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, Edit, Plus, FileText, Trash2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Worker {
  id: string;
  passport_no: string;
  name: string;
  center_ref: string;
  nationality_code: string;
  job1: string;
  job2?: string;
  age: number;
  status: string;
  created_at: string;
  maid_status: string;
  staff?: boolean;
}

const MyCVs = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin, isProduct } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadMyWorkers();
  }, [showAll, isAdmin, isProduct]);

  const loadMyWorkers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view your CVs",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      let query = supabase
        .from("workers")
        .select("*")
        .order("created_at", { ascending: false });

      // Filter out staff CVs for non-admin/non-product users
      if (!(isAdmin || isProduct)) {
        query = query.eq("staff", false);
      }

      if (!((isAdmin || isProduct) && showAll)) {
        query = query.eq("created_by", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setWorkers((data || []) as any);
    } catch (error: any) {
      console.error("Error loading CVs:", error);
      toast({
        title: "Error",
        description: "Failed to load your CVs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
      case "Ready for Market":
        return "default";
      case "Available":
        return "secondary";
      case "Sold":
        return "outline";
      case "Reserved":
        return "outline";
      case "Rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const canEdit = (worker: Worker) => {
    return !['Sold', 'Reserved'].includes(worker.status);
  };

  const handleDeleteClick = (workerId: string) => {
    setWorkerToDelete(workerId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!workerToDelete) return;

    try {
      const { error } = await supabase
        .from("workers")
        .delete()
        .eq("id", workerToDelete);

      if (error) throw error;

      toast({
        title: "Success",
        description: "CV deleted successfully",
      });

      loadMyWorkers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete CV",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setWorkerToDelete(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{(isAdmin || isProduct) && showAll ? 'All CVs' : 'My CVs'}</h1>
            <p className="text-muted-foreground">
              {(isAdmin || isProduct) && showAll ? 'Viewing all CVs in the system' : 'View and manage your submitted worker CVs'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(isAdmin || isProduct) && (
              <div className="flex rounded-md border">
                <Button variant={showAll ? 'outline' : 'default'} size="sm" onClick={() => setShowAll(false)}>My CVs</Button>
                <Button variant={showAll ? 'default' : 'outline'} size="sm" onClick={() => setShowAll(true)}>All CVs</Button>
              </div>
            )}
            <Button onClick={() => navigate('/cvwizard')}>
              <Plus className="h-4 w-4 mr-2" />
              Create New CV
            </Button>
          </div>
        </div>

        {workers.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No CVs Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't created any worker CVs yet
              </p>
              <Button onClick={() => navigate('/cvwizard')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First CV
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {workers.map((worker) => (
              <Card key={worker.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{worker.name}</CardTitle>
                      <CardDescription>
                        {worker.center_ref} • {worker.passport_no}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(worker.status)}>
                      {worker.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nationality</p>
                      <p className="font-medium">{worker.nationality_code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Job</p>
                      <p className="font-medium">{worker.job1}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Age</p>
                      <p className="font-medium">{worker.age}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Submitted</p>
                      <p className="font-medium text-sm">
                        {new Date(worker.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/admin/cvwizard-review?id=${worker.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>

                    {canEdit(worker) && (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => navigate(`/cvwizard?id=${worker.id}`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit CV
                      </Button>
                    )}

                    {(isAdmin || isProduct) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(worker.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    )}

                    {!canEdit(worker) && !(isAdmin || isProduct) && (
                      <p className="text-sm text-muted-foreground py-2">
                        This CV cannot be edited (Status: {worker.status})
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete CV</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this CV? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default MyCVs;
