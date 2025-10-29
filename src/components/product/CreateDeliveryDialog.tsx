import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateDeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateDeliveryDialog = ({ open, onOpenChange }: CreateDeliveryDialogProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    worker_id: "",
    contract_id: "",
    client_name: "",
    client_phone: "",
    delivery_location: "",
    notes: "",
  });

  // Fetch workers that have been received but not yet delivered
  const { data: receivedWorkers } = useQuery({
    queryKey: ["received-workers"],
    queryFn: async () => {
      // Get workers with receipt orders that don't have delivery orders yet
      const { data: receipts, error: receiptError } = await supabase
        .from("receipt_orders")
        .select("worker_id, workers(id, name, passport_no)")
        .eq("status", "Completed");

      if (receiptError) throw receiptError;

      // Get workers that already have deliveries
      const { data: deliveries, error: deliveryError } = await supabase
        .from("delivery_orders")
        .select("worker_id");

      if (deliveryError) throw deliveryError;

      const deliveredWorkerIds = new Set(deliveries?.map(d => d.worker_id));
      
      return receipts?.filter(receipt => 
        receipt.worker_id && !deliveredWorkerIds.has(receipt.worker_id)
      ).map(r => r.workers).filter(Boolean);
    },
    enabled: open,
  });

  // Fetch active contracts for the selected worker
  const { data: contracts } = useQuery({
    queryKey: ["worker-contracts", formData.worker_id],
    queryFn: async () => {
      if (!formData.worker_id) return [];
      
      const { data, error } = await supabase
        .from("contracts")
        .select("id, contract_number, client_name, client_phone")
        .eq("worker_id", formData.worker_id)
        .in("status", ["Active", "Draft"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!formData.worker_id && open,
  });

  const createDeliveryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (!data.worker_id) throw new Error("Please select a worker");

      // Generate delivery number
      const { data: deliveryNumber, error: fnError } = await supabase
        .rpc("generate_delivery_number");
      if (fnError) throw fnError;

      const { error } = await supabase.from("delivery_orders").insert({
        delivery_number: deliveryNumber,
        worker_id: data.worker_id,
        contract_id: data.contract_id || null,
        client_name: data.client_name,
        client_phone: data.client_phone,
        delivery_location: data.delivery_location,
        notes: data.notes,
        delivered_by: user.id,
        status: "Completed",
      });

      if (error) throw error;

      // Update worker status to "With Client"
      const { error: updateError } = await supabase
        .from("workers")
        .update({ status: "With Client" })
        .eq("id", data.worker_id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success("Delivery Order created successfully");
      queryClient.invalidateQueries({ queryKey: ["delivery-orders"] });
      queryClient.invalidateQueries({ queryKey: ["received-workers"] });
      onOpenChange(false);
      setFormData({
        worker_id: "",
        contract_id: "",
        client_name: "",
        client_phone: "",
        delivery_location: "",
        notes: "",
      });
    },
    onError: (error) => {
      toast.error("Failed to create Delivery Order: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDeliveryMutation.mutate(formData);
  };

  const handleContractChange = (contractId: string) => {
    const contract = contracts?.find(c => c.id === contractId);
    if (contract) {
      setFormData({
        ...formData,
        contract_id: contractId,
        client_name: contract.client_name,
        client_phone: contract.client_phone,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Delivery Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="worker">Worker (Received)</Label>
            <Select
              value={formData.worker_id}
              onValueChange={(value) => setFormData({ ...formData, worker_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select received worker" />
              </SelectTrigger>
              <SelectContent>
                {receivedWorkers?.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    {worker.name} ({worker.passport_no})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              Only workers with Receipt Orders are shown
            </p>
          </div>

          {formData.worker_id && (
            <div>
              <Label htmlFor="contract">Contract (Optional)</Label>
              <Select
                value={formData.contract_id}
                onValueChange={handleContractChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contract or enter client manually" />
                </SelectTrigger>
                <SelectContent>
                  {contracts?.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.contract_number} - {contract.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="client_name">Client Name</Label>
            <Input
              id="client_name"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              placeholder="Client name"
              required
            />
          </div>

          <div>
            <Label htmlFor="client_phone">Client Phone</Label>
            <Input
              id="client_phone"
              value={formData.client_phone}
              onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
              placeholder="Client phone number"
              required
            />
          </div>

          <div>
            <Label htmlFor="delivery_location">Delivery Location</Label>
            <Input
              id="delivery_location"
              value={formData.delivery_location}
              onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
              placeholder="e.g., Client address, Office"
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Delivery notes, items handed over, etc."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDeliveryMutation.isPending}>
              {createDeliveryMutation.isPending ? "Creating..." : "Create Delivery"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
