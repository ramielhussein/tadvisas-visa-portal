import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, RefreshCw, Plus, Truck, FileText, Users } from "lucide-react";
import CreateTransferDialog from "@/components/transfers/CreateTransferDialog";
import TransferDetailDialog from "@/components/transfers/TransferDetailDialog";
import DriverTrackingMap from "@/components/mapbox/DriverTrackingMap";

interface WorkerTransfer {
  id: string;
  transfer_number: string;
  title: string | null;
  worker_id: string;
  from_location: string;
  to_location: string;
  transfer_date: string;
  transfer_time: string | null;
  transfer_type: string;
  transfer_category: string | null;
  hr_subtype: string | null;
  admin_details: string | null;
  notes: string | null;
  status: string | null;
  handled_by: string;
  created_at: string;
  updated_at: string;
  client_name: string | null;
  contract_id: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  vehicle_number: string | null;
  documents: any;
  driver_id: string | null;
  driver_status: string | null;
  accepted_at: string | null;
  pickup_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  proof_photo_url: string | null;
  gmap_link: string | null;
  driver?: {
    email: string;
    full_name: string | null;
  };
  worker?: {
    name: string;
    center_ref: string;
  };
}

const WorkerTransfers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transfers, setTransfers] = useState<WorkerTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<WorkerTransfer | null>(null);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("worker_transfers")
        .select(`
          *,
          worker:workers(name, center_ref)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Fetch driver profiles separately if needed
      const transfersWithDrivers = await Promise.all(
        (data || []).map(async (transfer: any) => {
          if (transfer.driver_id) {
            const { data: driverData } = await supabase
              .from("profiles")
              .select("email, full_name")
              .eq("id", transfer.driver_id)
              .single();
            return { ...transfer, driver: driverData };
          }
          return transfer;
        })
      );
      
      setTransfers(transfersWithDrivers as any);
    } catch (error: any) {
      console.error("Error fetching transfers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch domestic worker transfers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "in transit":
      case "in_transit":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "accepted":
        return "bg-indigo-100 text-indigo-800 hover:bg-indigo-100";
      case "pickup":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      case "delivered":
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case "ADMIN":
        return <FileText className="w-4 h-4 text-orange-500" />;
      case "HR":
        return <Users className="w-4 h-4 text-blue-500" />;
      default:
        return <Truck className="w-4 h-4 text-primary" />;
    }
  };

  const formatHRSubtype = (subtype: string | null) => {
    if (!subtype) return "";
    const labels: Record<string, string> = {
      ATTEND_MEDICAL: "Attend Medical",
      TAWJEEH: "Tawjeeh",
      BIOMETRICS: "Biometrics",
      PASSPORT_DELIVERY: "Passport Delivery",
    };
    return labels[subtype] || subtype;
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
                <RefreshCw className="w-8 h-8" />
                Domestic Worker Transfers
              </h1>
              <p className="text-muted-foreground">Log all domestic worker movements between locations</p>
            </div>
          </div>
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Transfer
          </Button>
        </div>

        <CreateTransferDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={fetchTransfers}
        />

        <TransferDetailDialog
          open={!!selectedTransfer}
          onOpenChange={(open) => !open && setSelectedTransfer(null)}
          transfer={selectedTransfer}
          onRefresh={fetchTransfers}
        />

        {/* Live Driver Tracking Map - All Drivers */}
        <DriverTrackingMap />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transfers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {transfers.filter((t) => t.driver_status?.toLowerCase() === "pending" || (!t.driver_id && !t.driver_status)).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Transit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {transfers.filter((t) => t.driver_status?.toLowerCase() === "in_transit" || t.driver_status?.toLowerCase() === "pickup").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {transfers.filter((t) => t.driver_status?.toLowerCase() === "completed" || t.driver_status?.toLowerCase() === "delivered").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transfers List */}
        <Card>
          <CardHeader>
            <CardTitle>Transfer Requests ({transfers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : transfers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No transfers found</div>
            ) : (
              <div className="space-y-3">
                {transfers.map((transfer) => (
                  <Card 
                    key={transfer.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50"
                    onClick={() => setSelectedTransfer(transfer)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            {getCategoryIcon(transfer.transfer_category)}
                            <span className="font-semibold">
                              {transfer.title || transfer.transfer_number || transfer.id.slice(0, 8)}
                            </span>
                            
                            {transfer.transfer_category && transfer.transfer_category !== "TRANSPORT" && (
                              <Badge variant="outline" className="text-xs">
                                {transfer.transfer_category}
                                {transfer.hr_subtype && ` - ${formatHRSubtype(transfer.hr_subtype)}`}
                              </Badge>
                            )}
                            {transfer.driver_status && (
                              <Badge className={getStatusColor(transfer.driver_status)}>
                                {transfer.driver_status.replace('_', ' ')}
                              </Badge>
                            )}
                            {transfer.driver && (
                              <Badge variant="outline" className="text-xs">
                                🚗 {transfer.driver.full_name || transfer.driver.email}
                              </Badge>
                            )}
                            {!transfer.driver_id && (
                              <Badge variant="secondary" className="text-xs">
                                Unassigned
                              </Badge>
                            )}
                          </div>
                          {transfer.worker && (
                            <div className="text-sm text-muted-foreground">
                              Worker: <span className="font-medium text-foreground">{transfer.worker.name}</span> ({transfer.worker.center_ref})
                            </div>
                          )}
                          {transfer.admin_details && (
                            <div className="text-sm bg-orange-50 dark:bg-orange-950/30 p-2 rounded">
                              <span className="font-medium">Admin Details:</span> {transfer.admin_details}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{transfer.from_location}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-medium">{transfer.to_location}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(transfer.transfer_date).toLocaleDateString()}
                            {transfer.transfer_time && ` at ${transfer.transfer_time}`}
                          </div>
                          {transfer.notes && (
                            <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                              {transfer.notes}
                            </div>
                          )}
                          {transfer.proof_photo_url && (
                            <div className="text-xs text-emerald-600">
                              ✓ Proof photo uploaded
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {transfer.proof_photo_url && (
                            <a href={transfer.proof_photo_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm">View Proof</Button>
                            </a>
                          )}
                        </div>
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

export default WorkerTransfers;
