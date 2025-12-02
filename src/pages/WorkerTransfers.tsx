import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, RefreshCw, Plus, Search } from "lucide-react";
import { format } from "date-fns";

interface WorkerTransfer {
  id: string;
  transfer_number: string;
  worker_id: string;
  from_location: string;
  to_location: string;
  transfer_date: string;
  transfer_time: string | null;
  transfer_type: string;
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
  driver?: {
    email: string;
    full_name: string | null;
  };
  worker?: {
    name: string;
    center_ref: string;
  };
}

const LOCATIONS = [
  "Airport",
  "Accommodation",
  "Office",
  "Center",
  "Client Location",
];

const WorkerTransfers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transfers, setTransfers] = useState<WorkerTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchWorkerQuery, setSearchWorkerQuery] = useState("");
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);

  const [formData, setFormData] = useState({
    from_location: "",
    to_location: "",
    contract_number: "",
    transfer_date: format(new Date(), "yyyy-MM-dd"),
    transfer_time: "",
    notes: "",
  });

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
          worker:workers(name, center_ref),
          driver:profiles!worker_transfers_driver_id_fkey(email, full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransfers(data as any || []);
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

  const searchWorkers = async (query: string) => {
    if (query.length < 2) {
      setWorkers([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("workers")
        .select("id, name, center_ref, nationality_code")
        .or(`name.ilike.%${query}%,center_ref.ilike.%${query}%`)
        .limit(5);

      if (error) throw error;
      setWorkers(data || []);
    } catch (error) {
      console.error("Error searching workers:", error);
    }
  };

  const handleCreateTransfer = async () => {
    if (!selectedWorker) {
      toast({
        title: "Error",
        description: "Please select a worker",
        variant: "destructive",
      });
      return;
    }

    if (!formData.from_location || !formData.to_location) {
      toast({
        title: "Error",
        description: "Please select both from and to locations",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: transferNumber } = await supabase.rpc("generate_transfer_number");

      const insertData: any = {
        worker_id: selectedWorker.id,
        from_location: formData.from_location === "Contract" ? formData.contract_number : formData.from_location,
        to_location: formData.to_location === "Contract" ? formData.contract_number : formData.to_location,
        transfer_date: formData.transfer_date,
        transfer_time: formData.transfer_time || null,
        transfer_type: "Internal",
        notes: formData.notes || null,
        handled_by: user.id,
      };

      // Only add transfer_number if the RPC function exists
      if (transferNumber) {
        insertData.transfer_number = transferNumber;
      }

      const { error } = await supabase.from("worker_transfers").insert(insertData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transfer request created successfully",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchTransfers();
    } catch (error: any) {
      console.error("Error creating transfer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create transfer request",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedWorker(null);
    setSearchWorkerQuery("");
    setWorkers([]);
    setFormData({
      from_location: "",
      to_location: "",
      contract_number: "",
      transfer_date: format(new Date(), "yyyy-MM-dd"),
      transfer_time: "",
      notes: "",
    });
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
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Transfer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Transfer Request</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Worker Selection */}
                <div className="space-y-2">
                  <Label>Worker *</Label>
                  {selectedWorker ? (
                    <div className="p-3 bg-primary/10 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium">{selectedWorker.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedWorker.center_ref}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedWorker(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search workers by name or reference..."
                        value={searchWorkerQuery}
                        onChange={(e) => {
                          setSearchWorkerQuery(e.target.value);
                          searchWorkers(e.target.value);
                        }}
                        className="pl-10"
                      />
                      {workers.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {workers.map((worker) => (
                            <div
                              key={worker.id}
                              className="p-3 hover:bg-accent cursor-pointer border-b last:border-0"
                              onClick={() => {
                                setSelectedWorker(worker);
                                setSearchWorkerQuery("");
                                setWorkers([]);
                              }}
                            >
                              <p className="font-medium">{worker.name}</p>
                              <p className="text-sm text-muted-foreground">{worker.center_ref} • {worker.nationality_code}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* From Location */}
                <div className="space-y-2">
                  <Label htmlFor="from_location">Transfer From *</Label>
                  <Select value={formData.from_location} onValueChange={(value) => setFormData({ ...formData, from_location: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                      <SelectItem value="Contract">Contract Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.from_location === "Contract" && (
                  <div className="space-y-2">
                    <Label htmlFor="contract_number">Contract Number</Label>
                    <Input
                      id="contract_number"
                      value={formData.contract_number}
                      onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                      placeholder="Enter contract number"
                    />
                  </div>
                )}

                {/* To Location */}
                <div className="space-y-2">
                  <Label htmlFor="to_location">Transfer To *</Label>
                  <Select value={formData.to_location} onValueChange={(value) => setFormData({ ...formData, to_location: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                      <SelectItem value="Contract">Contract Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transfer_date">Service Date *</Label>
                    <Input
                      id="transfer_date"
                      type="date"
                      value={formData.transfer_date}
                      onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transfer_time">Service Time</Label>
                    <Input
                      id="transfer_time"
                      type="time"
                      value={formData.transfer_time}
                      onChange={(e) => setFormData({ ...formData, transfer_time: e.target.value })}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Instructions / Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    placeholder="Add any additional instructions or notes..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTransfer} className="flex-1">
                    Create Transfer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

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
                {transfers.filter((t) => t.status?.toLowerCase() === "pending").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Transit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {transfers.filter((t) => t.status?.toLowerCase() === "in transit").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {transfers.filter((t) => t.status?.toLowerCase() === "completed").length}
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
                  <Card key={transfer.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-semibold">{transfer.transfer_number || transfer.id.slice(0, 8)}</span>
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
