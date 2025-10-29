import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ClipboardList, Plus } from "lucide-react";

interface WorkerReturn {
  id: string;
  worker_id: string;
  worker_name: string;
  return_date: string;
  return_reason: string;
  client_name: string | null;
  contract_id: string | null;
  redeployment_status: string;
  medical_checkup_done: boolean;
  documents_collected: boolean;
  notes: string | null;
  created_at: string;
}

const WorkerReturns = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [returns, setReturns] = useState<WorkerReturn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      // Since worker_returns table doesn't exist yet, we'll show a placeholder
      // You can create the table via migration when needed
      toast({
        title: "Coming Soon",
        description: "Worker Returns feature will be available soon",
      });
      setReturns([]);
    } catch (error: any) {
      console.error("Error fetching returns:", error);
      toast({
        title: "Error",
        description: "Failed to fetch worker returns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "redeployed":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "processing":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

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
                <ClipboardList className="w-8 h-8" />
                Worker Returns
              </h1>
              <p className="text-muted-foreground">Process returned workers and redeployment checklist</p>
            </div>
          </div>
          <Button onClick={() => toast({ title: "Coming Soon", description: "Process return feature coming soon" })}>
            <Plus className="w-4 h-4 mr-2" />
            Process Return
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Returns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">0</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Redeployed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">0</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">0</div>
            </CardContent>
          </Card>
        </div>

        {/* Returns List */}
        <Card>
          <CardHeader>
            <CardTitle>Worker Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Worker Returns Feature</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                This feature allows you to process workers who have been returned from clients and manage their redeployment checklist.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground max-w-md mx-auto text-left">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                  <span>Record return reasons and documentation</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                  <span>Track medical checkups and document collection</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                  <span>Manage redeployment status and availability</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                  <span>Generate redeployment reports</span>
                </div>
              </div>
              <Button className="mt-6" onClick={() => toast({ title: "Coming Soon", description: "This feature is under development" })}>
                Request Access
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default WorkerReturns;
