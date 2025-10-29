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

interface CreateReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LOCATIONS = ["Office", "Center", "Accommodation", "Airport", "Other"];

export const CreateReceiptDialog = ({ open, onOpenChange }: CreateReceiptDialogProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    worker_id: "",
    po_id: "",
    location: "",
    received_from: "",
    condition_notes: "",
    documents_received: [] as string[],
  });

  // Fetch workers that have POs but haven't been received yet
  const { data: availableWorkers } = useQuery({
    queryKey: ["workers-with-pos"],
    queryFn: async () => {
      // Get workers with POs that don't have receipt orders yet
      const { data: pos, error: poError } = await supabase
        .from("purchase_orders")
        .select("id, po_number, worker_id, workers(id, name, passport_no)")
        .not("worker_id", "is", null)
        .order("created_at", { ascending: false });

      if (poError) throw poError;

      // Filter out workers that already have receipts
      const { data: receipts, error: receiptError } = await supabase
        .from("receipt_orders")
        .select("worker_id");

      if (receiptError) throw receiptError;

      const receivedWorkerIds = new Set(receipts?.map(r => r.worker_id));
      
      return pos?.filter(po => 
        po.worker_id && !receivedWorkerIds.has(po.worker_id)
      );
    },
    enabled: open,
  });

  const createReceiptMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (!data.worker_id) throw new Error("Please select a worker");

      // Generate receipt number
      const { data: receiptNumber, error: fnError } = await supabase
        .rpc("generate_receipt_number");
      if (fnError) throw fnError;

      const { error } = await supabase.from("receipt_orders").insert({
        receipt_number: receiptNumber,
        worker_id: data.worker_id,
        po_id: data.po_id || null,
        location: data.location,
        received_from: data.received_from,
        condition_notes: data.condition_notes,
        documents_received: data.documents_received,
        received_by: user.id,
        status: "Completed",
      });

      if (error) throw error;

      // Update worker status to "Received"
      const { error: updateError } = await supabase
        .from("workers")
        .update({ status: "Received" })
        .eq("id", data.worker_id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success("Receipt Order created successfully");
      queryClient.invalidateQueries({ queryKey: ["receipt-orders"] });
      queryClient.invalidateQueries({ queryKey: ["workers-with-pos"] });
      onOpenChange(false);
      setFormData({
        worker_id: "",
        po_id: "",
        location: "",
        received_from: "",
        condition_notes: "",
        documents_received: [],
      });
    },
    onError: (error) => {
      toast.error("Failed to create Receipt Order: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReceiptMutation.mutate(formData);
  };

  const handleWorkerChange = (workerId: string) => {
    const selectedPO = availableWorkers?.find(po => po.worker_id === workerId);
    setFormData({ 
      ...formData, 
      worker_id: workerId,
      po_id: selectedPO?.id || ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Receipt Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="worker">Worker (with PO)</Label>
            <Select
              value={formData.worker_id}
              onValueChange={handleWorkerChange}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select worker with PO" />
              </SelectTrigger>
              <SelectContent>
                {availableWorkers?.map((po) => (
                  <SelectItem key={po.worker_id} value={po.worker_id!}>
                    {po.workers?.name} ({po.workers?.passport_no}) - PO: {po.po_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              Only workers with Purchase Orders are shown
            </p>
          </div>

          <div>
            <Label htmlFor="location">Receipt Location</Label>
            <Select
              value={formData.location}
              onValueChange={(value) => setFormData({ ...formData, location: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="received_from">Received From</Label>
            <Input
              id="received_from"
              value={formData.received_from}
              onChange={(e) => setFormData({ ...formData, received_from: e.target.value })}
              placeholder="e.g., Supplier name, Agent, Airport"
              required
            />
          </div>

          <div>
            <Label htmlFor="condition_notes">Condition Notes</Label>
            <Textarea
              id="condition_notes"
              value={formData.condition_notes}
              onChange={(e) => setFormData({ ...formData, condition_notes: e.target.value })}
              placeholder="Note worker's condition, documents received, etc."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createReceiptMutation.isPending}>
              {createReceiptMutation.isPending ? "Creating..." : "Create Receipt"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
