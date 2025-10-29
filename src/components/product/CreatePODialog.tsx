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

interface CreatePODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreatePODialog = ({ open, onOpenChange }: CreatePODialogProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    worker_id: "",
    supplier_id: "",
    total_amount: "",
    payment_terms: "",
    notes: "",
  });

  const { data: workers } = useQuery({
    queryKey: ["workers-for-po"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workers")
        .select("id, name, passport_no")
        .eq("status", "Available")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers-for-po"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, supplier_name")
        .eq("status", "Active")
        .order("supplier_name");
      if (error) throw error;
      return data;
    },
  });

  const createPOMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate PO number
      const { data: poNumber, error: fnError } = await supabase
        .rpc("generate_po_number");
      if (fnError) throw fnError;

      const { error } = await supabase.from("purchase_orders").insert({
        po_number: poNumber,
        worker_id: data.worker_id || null,
        supplier_id: data.supplier_id || null,
        total_amount: parseFloat(data.total_amount),
        payment_terms: data.payment_terms,
        notes: data.notes,
        created_by: user.id,
        status: "Draft",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Purchase Order created successfully");
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      onOpenChange(false);
      setFormData({
        worker_id: "",
        supplier_id: "",
        total_amount: "",
        payment_terms: "",
        notes: "",
      });
    },
    onError: (error) => {
      toast.error("Failed to create Purchase Order: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPOMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="worker">Worker</Label>
            <Select
              value={formData.worker_id}
              onValueChange={(value) => setFormData({ ...formData, worker_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select worker" />
              </SelectTrigger>
              <SelectContent>
                {workers?.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    {worker.name} ({worker.passport_no})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="supplier">Supplier</Label>
            <Select
              value={formData.supplier_id}
              onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers?.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.supplier_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Amount (AED)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              required
              value={formData.total_amount}
              onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="payment_terms">Payment Terms</Label>
            <Input
              id="payment_terms"
              value={formData.payment_terms}
              onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              placeholder="e.g., Net 30"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPOMutation.isPending}>
              {createPOMutation.isPending ? "Creating..." : "Create PO"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
