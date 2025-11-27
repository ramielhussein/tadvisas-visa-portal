import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, DollarSign } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

interface Supplier {
  id: string;
  supplier_name: string;
  supplier_type: string;
}

interface PullWorkerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workerId: string;
  workerName: string;
  onSuccess: () => void;
}

const PullWorkerDialog = ({ open, onOpenChange, workerId, workerName, onSuccess }: PullWorkerDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [costAmount, setCostAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<Date>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days default
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const fetchSuppliers = async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, supplier_name, supplier_type')
        .eq('status', 'Active')
        .order('supplier_name');

      if (error) {
        console.error('Error fetching suppliers:', error);
      } else {
        setSuppliers(data || []);
      }
    };

    if (open) {
      fetchSuppliers();
    }
  }, [open]);

  const vatRate = 5;
  const vatAmount = (costAmount * vatRate) / 100;
  const totalAmount = costAmount + vatAmount;

  const handleSubmit = async () => {
    if (!selectedSupplier || costAmount <= 0) {
      toast({
        title: "Missing Information",
        description: "Please select a supplier and enter the cost amount",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Get supplier details
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('supplier_name')
        .eq('id', selectedSupplier)
        .single();

      // Generate invoice number
      const { data: invoiceNumberData, error: invoiceNumberError } = await supabase.rpc('generate_supplier_invoice_number');
      if (invoiceNumberError) throw invoiceNumberError;

      // Create supplier invoice
      const { error: invoiceError } = await supabase
        .from('supplier_invoices')
        .insert({
          invoice_number: invoiceNumberData,
          supplier_id: selectedSupplier,
          supplier_name: supplier?.supplier_name || '',
          subtotal: costAmount,
          vat_rate: vatRate,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          status: 'Pending',
          due_date: dueDate.toISOString().split('T')[0],
          description: `Worker acquisition: ${workerName}`,
          notes: notes
        } as any);

      if (invoiceError) throw invoiceError;

      // Create worker-supplier link
      const { error: linkError } = await supabase
        .from('worker_suppliers')
        .insert({
          worker_id: workerId,
          supplier_id: selectedSupplier,
          cost_amount: costAmount,
          cost_type: 'Acquisition',
          notes: notes
        });

      if (linkError) throw linkError;

      // Update worker status to "Ready for Market"
      const { error: workerError } = await supabase
        .from('workers')
        .update({ status: 'Ready for Market' })
        .eq('id', workerId);

      if (workerError) throw workerError;

      toast({
        title: "Success",
        description: `Worker pulled from supplier. Invoice ${invoiceNumberData} created.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error pulling worker:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to pull worker from supplier",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Pull Worker from Supplier
          </DialogTitle>
          <DialogDescription>
            Create a supplier bill and mark {workerName} as "Ready for Market"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Supplier *</Label>
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier..." />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.supplier_name} ({supplier.supplier_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost-amount">Cost Amount (AED) *</Label>
            <Input
              id="cost-amount"
              type="number"
              min="0"
              step="0.01"
              value={costAmount || ""}
              onChange={(e) => setCostAmount(parseFloat(e.target.value) || 0)}
              placeholder="Enter cost amount"
            />
            <p className="text-sm text-muted-foreground">Amount excluding VAT</p>
          </div>

          <div className="space-y-2">
            <Label>Due Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dueDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => date && setDueDate(date)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
            />
          </div>

          {/* Summary */}
          <div className="rounded-lg border p-4 space-y-3 bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4" />
              <span className="font-semibold">Bill Summary</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Cost Amount:</span>
              <span className="font-medium">AED {costAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>VAT (5%):</span>
              <span className="font-medium">AED {vatAmount.toLocaleString()}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between font-bold">
              <span>Total Bill Amount:</span>
              <span className="text-primary">AED {totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-4 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Bill & Pull Worker
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PullWorkerDialog;
