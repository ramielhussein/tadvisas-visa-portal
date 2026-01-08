import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfileNameMap } from "@/lib/profileLookup";
import { Loader2, Eye, Edit, Plus, FileText, Trash2, Search, X } from "lucide-react";
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
  date_of_birth?: string;
  status: string;
  created_at: string;
  maid_status: string;
  staff?: boolean;
  created_by_name?: string;
}

const calculateAge = (dob: string | undefined): number | null => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const MyCVs = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin, isProduct } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<string | null>(null);
  const [searchName, setSearchName] = useState("");
  const [filterNationality, setFilterNationality] = useState<string>("all");
  const [filterProfession, setFilterProfession] = useState<string>("all");

  // Get unique nationalities and professions for filter dropdowns
  const nationalities = useMemo(() => {
    const codes = [...new Set(workers.map(w => w.nationality_code).filter(Boolean))];
    return codes.sort();
  }, [workers]);

  const professions = useMemo(() => {
    const jobs = [...new Set(workers.map(w => w.job1).filter(Boolean))];
    return jobs.sort();
  }, [workers]);

  // Filter workers based on search/filters
  const filteredWorkers = useMemo(() => {
    return workers.filter(worker => {
      const matchesName = searchName === "" || 
        worker.name.toLowerCase().includes(searchName.toLowerCase());
      const matchesNationality = filterNationality === "all" || 
        worker.nationality_code === filterNationality;
      const matchesProfession = filterProfession === "all" || 
        worker.job1 === filterProfession;
      return matchesName && matchesNationality && matchesProfession;
    });
  }, [workers, searchName, filterNationality, filterProfession]);

  const clearFilters = () => {
    setSearchName("");
    setFilterNationality("all");
    setFilterProfession("all");
  };

  const hasActiveFilters = searchName || filterNationality !== "all" || filterProfession !== "all";

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

      // Non-admin/product OR admins viewing "My CVs" should only see their own.
      if (!((isAdmin || isProduct) && showAll)) {
        query = query.eq("created_by", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const creatorMap = await fetchProfileNameMap((data ?? []).map((w: any) => w.created_by));
      const workersWithCreator = (data || []).map((w: any) => ({
        ...w,
        created_by_name: w.created_by ? (creatorMap[w.created_by] || "Unknown") : "Unknown",
      }));

      setWorkers(workersWithCreator as any);
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

        {/* Search and Filter Section */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterNationality} onValueChange={setFilterNationality}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Nationality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Nationalities</SelectItem>
                  {nationalities.map(nat => (
                    <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterProfession} onValueChange={setFilterProfession}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Profession" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Professions</SelectItem>
                  {professions.map(job => (
                    <SelectItem key={job} value={job}>{job}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear filters">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {hasActiveFilters && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing {filteredWorkers.length} of {workers.length} CVs
              </p>
            )}
          </CardContent>
        </Card>

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
        ) : filteredWorkers.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Matching CVs</h3>
              <p className="text-muted-foreground mb-4">
                No CVs match your search criteria
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredWorkers.map((worker) => (
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
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
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
                      <p className="font-medium">{calculateAge(worker.date_of_birth) ?? 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created By</p>
                      <p className="font-medium">{worker.created_by_name || 'Unknown'}</p>
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
