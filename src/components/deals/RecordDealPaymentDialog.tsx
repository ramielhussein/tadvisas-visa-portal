import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, DollarSign } from "lucide-react";

interface Deal {
  id: string;
  deal_number: string;
  client_name: string;
  client_phone: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: string;
  service_type?: string;
}

interface RecordDealPaymentDialogProps {
  open: boolean;
  deal: Deal | null;
  onClose: () => void;
  onSuccess: () => void;
}

const RecordDealPaymentDialog = ({ open, deal, onClose, onSuccess }: RecordDealPaymentDialogProps) => {
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
    service_type: "",
  });
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchPaymentMethods();
      fetchBankAccounts();
      fetchServiceTypes();
      
      // Pre-fill amount with balance due and service type from deal
      if (deal) {
        setFormData(prev => ({
          ...prev,
          // Avoid pre-filling a negative amount if the deal is already (slightly) overpaid due to rounding.
          amount: Math.max(0, deal.balance_due).toString(),
          service_type: deal.service_type || ""
        }));
      }
    }
  }, [open, deal]);

  const fetchServiceTypes = async () => {
    const { data } = await supabase
      .from("deals")
      .select("service_type")
      .not("service_type", "is", null);
    
    if (data) {
      const uniqueTypes = [...new Set(data.map(d => d.service_type).filter(Boolean))];
      setServiceTypes(uniqueTypes.sort());
    }
  };

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
      // Some records may have null/legacy status values; don't block payment recording.
      .or("status.eq.Active,status.is.null")
      .order("account_name");
    
    setBankAccounts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal) return;

    const amount = parseFloat(formData.amount);
    // Allow tiny overpayments to handle rounding (e.g. 4,679.98 total paid as 4,680.00 cash).
    const overpayTolerance = 0.05;
    
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Payment amount must be greater than zero",
        variant: "destructive",
      });
      return;
    }

    // Only enforce max amount when there is a positive balance due.
    if (deal.balance_due > 0 && (amount - deal.balance_due > overpayTolerance)) {
      toast({
        title: "Amount Too High",
        description: `Payment cannot exceed balance due (${deal.balance_due.toLocaleString()} AED)`,
        variant: "destructive",
      });
      return;
    }

    if (!formData.bank_account_id && bankAccounts.length > 0) {
      toast({
        title: "Bank Account Required",
        description: "Please select which bank account received the payment",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate unique payment number with timestamp and random suffix
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timePart = now.getTime().toString().slice(-6);
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const paymentNumber = `PAY-${datePart}-${timePart}-${randomPart}`;

      // Create payment record
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          payment_number: paymentNumber,
          deal_id: deal.id,
          client_name: deal.client_name,
          client_phone: deal.client_phone,
          amount: amount,
          payment_date: formData.payment_date,
          payment_method: formData.payment_method || null,
          bank_account_id: formData.bank_account_id,
          reference_number: formData.reference_number || null,
          notes: formData.notes || null,
          recorded_by: user.id,
          service_type: formData.service_type || null,
        });

      if (paymentError) throw paymentError;

      toast({
        title: "Payment Recorded",
        description: `Payment of ${amount.toLocaleString()} AED has been recorded successfully`,
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      amount: "",
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: "",
      bank_account_id: "",
      reference_number: "",
      notes: "",
      service_type: "",
    });
    onClose();
  };

  if (!deal) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Record Payment - {deal.deal_number}
          </DialogTitle>
        </DialogHeader>

        {/* Payment Summary */}
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Total Amount</p>
              <p className="font-semibold text-lg">{deal.total_amount.toLocaleString()} AED</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Paid</p>
              <p className="font-semibold text-lg text-green-600">{deal.paid_amount.toLocaleString()} AED</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Balance Due</p>
              <p className="font-semibold text-lg text-orange-600">{deal.balance_due.toLocaleString()} AED</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Payment Amount (AED) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                placeholder="Enter amount"
              />
            </div>

            <div>
              <Label htmlFor="payment_date">Payment Date *</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="service_type">Service Type</Label>
              <Select 
                value={formData.service_type} 
                onValueChange={(value) => setFormData({ ...formData, service_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Defaults to deal's service type. Change if payment is for different service.
              </p>
            </div>

            <div>
              <Label htmlFor="bank_account">Bank Account * (Where was the money received?)</Label>
              <Select 
                value={formData.bank_account_id} 
                onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.bank_name} - {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
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

            <div>
              <Label htmlFor="reference_number">Reference Number</Label>
              <Input
                id="reference_number"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                placeholder="Check/Transaction #"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Record Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecordDealPaymentDialog;
