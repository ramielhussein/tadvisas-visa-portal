import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Worker {
  id: string;
  passport_no: string;
  name: string;
  center_ref: string;
  nationality_code: string;
  job1: string;
  age: number;
  status: string;
  created_at: string;
  maid_status: string;
  experience: Array<{ country: string; years: number }>;
  languages: Array<{ name: string; level: string }>;
  financials: any;
}

const CVWizardReview = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from("workers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setWorkers((data || []) as any);
    } catch (error: any) {
      console.error("Error loading workers:", error);
      toast({
        title: "Error",
        description: "Failed to load CVs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (worker: Worker) => {
    setSelectedWorker(worker);
    setDialogOpen(true);
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from("workers")
        .update({ status: "Approved" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "CV approved",
      });

      loadWorkers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from("workers")
        .update({ status: "Rejected" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "CV rejected",
      });

      loadWorkers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold">CV Review</h1>
          <p className="text-muted-foreground">Review and approve worker CVs</p>
        </div>

        <div className="grid gap-4">
          {workers.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No CVs submitted yet
              </CardContent>
            </Card>
          )}

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
                  <Badge
                    variant={
                      worker.status === "Approved"
                        ? "default"
                        : worker.status === "Rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
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
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium text-sm">{worker.maid_status}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleView(worker)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>

                  {worker.status === "Available" && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(worker.id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReject(worker.id)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedWorker && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedWorker.name}</DialogTitle>
                <DialogDescription>{selectedWorker.center_ref}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Passport No</p>
                    <p className="font-medium">{selectedWorker.passport_no}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">{selectedWorker.age}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nationality</p>
                    <p className="font-medium">{selectedWorker.nationality_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Job</p>
                    <p className="font-medium">{selectedWorker.job1}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Languages</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorker.languages.map((lang, i) => (
                      <Badge key={i} variant="secondary">
                        {lang.name} - {lang.level}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Experience</p>
                  {selectedWorker.experience.length === 0 ? (
                    <p className="text-sm">No experience listed</p>
                  ) : (
                    <ul className="space-y-1">
                      {selectedWorker.experience.map((exp, i) => (
                        <li key={i} className="text-sm">
                          {exp.country}: {exp.years} years
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {selectedWorker.financials && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Financials</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Cost</p>
                        <p className="font-medium">
                          {selectedWorker.financials.total_cost || 0} AED
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Revenue</p>
                        <p className="font-medium">
                          {selectedWorker.financials.total_revenue || 0} AED
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">P&L</p>
                        <p
                          className={`font-medium ${
                            (selectedWorker.financials.pnl || 0) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {selectedWorker.financials.pnl || 0} AED
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
};

export default CVWizardReview;
