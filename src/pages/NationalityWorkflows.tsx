import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Globe, Plus } from "lucide-react";

interface NationalityWorkflow {
  id: string;
  worker_id: string;
  nationality_code: string;
  current_step: string;
  workflow_status: string;
  visa_type: string | null;
  agent_informed_date: string | null;
  po_raised_date: string | null;
  medical_obtained_date: string | null;
  visa_applied_date: string | null;
  visa_received_date: string | null;
  ticket_booked_date: string | null;
  travel_date: string | null;
  arrival_date: string | null;
  created_at: string;
  updated_at: string;
}

const NationalityWorkflows = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<NationalityWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterNationality, setFilterNationality] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("nationality_workflows")
        .select("*")
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error: any) {
      console.error("Error fetching workflows:", error);
      toast({
        title: "Error",
        description: "Failed to fetch nationality workflows",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "in progress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const filteredWorkflows = workflows.filter((workflow) => {
    if (filterNationality !== "all" && workflow.nationality_code !== filterNationality) {
      return false;
    }
    if (filterStatus !== "all" && workflow.workflow_status !== filterStatus) {
      return false;
    }
    return true;
  });

  const nationalities = Array.from(new Set(workflows.map((w) => w.nationality_code)));
  const statuses = Array.from(new Set(workflows.map((w) => w.workflow_status)));

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/product/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Globe className="w-8 h-8" />
                Nationality Workflows
              </h1>
              <p className="text-muted-foreground">Track visa and processing by nationality</p>
            </div>
          </div>
          <Button onClick={() => toast({ title: "Coming Soon", description: "Create workflow feature coming soon" })}>
            <Plus className="w-4 h-4 mr-2" />
            New Workflow
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Filter by Nationality</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={filterNationality}
                  onChange={(e) => setFilterNationality(e.target.value)}
                >
                  <option value="all">All Nationalities</option>
                  {nationalities.map((nat) => (
                    <option key={nat} value={nat}>
                      {nat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Filter by Status</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workflows.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {workflows.filter((w) => w.workflow_status === "In Progress").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {workflows.filter((w) => w.workflow_status === "Completed").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {workflows.filter((w) => w.workflow_status === "Pending").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflows List */}
        <Card>
          <CardHeader>
            <CardTitle>Workflows ({filteredWorkflows.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredWorkflows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No workflows found</div>
            ) : (
              <div className="space-y-4">
                {filteredWorkflows.map((workflow) => (
                  <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(workflow.workflow_status)}>
                              {workflow.workflow_status}
                            </Badge>
                            <span className="font-semibold">{workflow.nationality_code}</span>
                            {workflow.visa_type && (
                              <span className="text-sm text-muted-foreground">• {workflow.visa_type}</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Current Step: <span className="font-medium text-foreground">{workflow.current_step}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground mt-3">
                            {workflow.agent_informed_date && (
                              <div>Agent Informed: {new Date(workflow.agent_informed_date).toLocaleDateString()}</div>
                            )}
                            {workflow.medical_obtained_date && (
                              <div>Medical: {new Date(workflow.medical_obtained_date).toLocaleDateString()}</div>
                            )}
                            {workflow.visa_applied_date && (
                              <div>Visa Applied: {new Date(workflow.visa_applied_date).toLocaleDateString()}</div>
                            )}
                            {workflow.arrival_date && (
                              <div>Arrival: {new Date(workflow.arrival_date).toLocaleDateString()}</div>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">View Details</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default NationalityWorkflows;
