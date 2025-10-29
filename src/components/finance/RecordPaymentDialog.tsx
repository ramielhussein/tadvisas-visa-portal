import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_phone: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: string;
}

interface RecordPaymentDialogProps {
  open: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onSuccess: () => void;
}

const RecordPaymentDialog = ({ open, invoice, onClose, onSuccess }: RecordPaymentDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    amount: "",
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: "",
    bank_account_id: "",
    reference_number: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      fetchPaymentMethods();
      fetchBankAccounts();
      
      // Pre-fill amount with balance due
      if (invoice) {
        setFormData(prev => ({
          ...prev,
          amount: invoice.balance_due.toString()
        }));
      }
    }
  }, [open, invoice]);

  const fetchPaymentMethods = async () => {
    const { data } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("is_active", true)
      .order("method_name");
    
    setPaymentMethods(data || []);
  };

  const fetchBankAccounts = async () => {
    const { data } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("status", "Active")
      .order("account_name");
    
    setBankAccounts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    const amount = parseFloat(formData.amount);
    
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Payment amount must be greater than zero",
        variant: "destructive",
      });
      return;
    }

    if (amount > invoice.balance_due) {
      toast({
        title: "Amount Too High",
        description: `Payment cannot exceed balance due (${invoice.balance_due.toLocaleString()} AED)`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate payment number
      const { data: paymentNumber, error: numberError } = await supabase.rpc('generate_payment_number');
      if (numberError) throw numberError;

      // Create payment record
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          payment_number: paymentNumber,
          invoice_id: invoice.id,
          client_name: invoice.client_name,
          client_phone: invoice.client_phone,
          amount: amount,
          payment_date: formData.payment_date,
          payment_method: formData.payment_method || null,
          bank_account_id: formData.bank_account_id || null,
          reference_number: formData.reference_number || null,
          notes: formData.notes || null,
          recorded_by: user.id,
        });

      if (paymentError) throw paymentError;

      toast({
        title: "Payment Recorded",
        description: `Payment ${paymentNumber} recorded successfully`,
      });

      // Reset form
      setFormData({
        amount: "",
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: "",
        bank_account_id: "",
        reference_number: "",
        notes: "",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record Payment - {invoice.invoice_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invoice Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Client:</span>
              <span className="font-medium">{invoice.client_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Invoice:</span>
              <span className="font-medium">{invoice.total_amount.toLocaleString()} AED</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Already Paid:</span>
              <span className="font-medium">{invoice.paid_amount.toLocaleString()} AED</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Balance Due:</span>
              <span className="text-primary">{invoice.balance_due.toLocaleString()} AED</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount (AED) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_date">Payment Date *</Label>
                <Input
                  id="payment_date"
                  type="date"
                  required
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.method_name}>
                        {method.method_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account">Bank Account</Label>
                <Select
                  value={formData.bank_account_id}
                  onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name} ({account.bank_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_number">Reference/Transaction Number</Label>
              <Input
                id="reference_number"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                placeholder="Cheque number, transfer ID, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this payment..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  "Record Payment"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordPaymentDialog;
