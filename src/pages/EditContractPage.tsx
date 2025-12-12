import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { ArrowLeft, Loader2 } from "lucide-react";

const EditContract = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deal, setDeal] = useState<any>(null);

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    service_type: "",
    service_description: "",
    deal_value: "",
    vat_rate: "5",
    payment_terms: "Full Payment",
    payment_method: "",
    bank_account: "",
    notes: "",
  });

  useEffect(() => {
    if (id) {
      fetchDeal();
      fetchPaymentMethods();
      fetchBankAccounts();
    }
  }, [id]);

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
      .order("bank_name");
    setBankAccounts(data || []);
  };

  const fetchDeal = async () => {
    try {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setDeal(data);
      setFormData({
        client_name: data.client_name || "",
        client_phone: data.client_phone || "",
        client_email: data.client_email || "",
        service_type: data.service_type || "",
        service_description: data.service_description || "",
        deal_value: data.deal_value?.toString() || "0",
        vat_rate: data.vat_rate?.toString() || "5",
        payment_terms: data.payment_terms || "Full Payment",
        payment_method: (data as any).payment_method || "",
        bank_account: (data as any).bank_account_id || "",
        notes: data.notes || "",
      });
    } catch (error: any) {
      console.error("Error fetching contract:", error);
      toast({
        title: "Error",
        description: "Failed to load contract",
        variant: "destructive",
      });
      navigate("/crm/contracts");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dealValue = parseFloat(formData.deal_value) || 0;
      const vatRate = parseFloat(formData.vat_rate) || 5;
      const vatAmount = (dealValue * vatRate) / 100;
      const totalAmount = dealValue + vatAmount;

      const { error } = await supabase
        .from("deals")
        .update({
          client_name: formData.client_name.trim(),
          client_phone: formData.client_phone.trim(),
          client_email: formData.client_email.trim() || null,
          service_type: formData.service_type,
          service_description: formData.service_description || null,
          deal_value: dealValue,
          vat_rate: vatRate,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          payment_terms: formData.payment_terms,
          notes: formData.notes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contract updated successfully",
      });

      navigate(`/crm/contracts/${id}`);
    } catch (error: any) {
      console.error("Error updating contract:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update contract",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!deal) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p>Contract not found</p>
        </div>
      </Layout>
    );
  }

  // Check if contract is editable (only Draft contracts can be edited)
  const isEditable = deal.status === "Draft";

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="ghost" onClick={() => navigate(`/crm/contracts/${id}`)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contract
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Edit Contract - {deal.deal_number}</span>
                {!isEditable && (
                  <span className="text-sm font-normal text-destructive">
                    ⚠️ Only Draft deals can be edited
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isEditable ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    This deal has been approved and can no longer be edited.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Status: <strong>{deal.status}</strong>
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate(`/crm/contracts/${id}`)}
                  >
                    View Contract Details
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Client Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Client Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="client_name">Client Name *</Label>
                        <Input
                          id="client_name"
                          value={formData.client_name}
                          onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client_phone">Client Phone *</Label>
                        <Input
                          id="client_phone"
                          value={formData.client_phone}
                          onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="client_email">Client Email</Label>
                        <Input
                          id="client_email"
                          type="email"
                          value={formData.client_email}
                          onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Service Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Service Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="service_type">Service Type *</Label>
                        <Input
                          id="service_type"
                          value={formData.service_type}
                          onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deal_value">Deal Value (AED) *</Label>
                        <Input
                          id="deal_value"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.deal_value}
                          onChange={(e) => setFormData({ ...formData, deal_value: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vat_rate">VAT Rate (%)</Label>
                        <Input
                          id="vat_rate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={formData.vat_rate}
                          onChange={(e) => setFormData({ ...formData, vat_rate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment_terms">Payment Terms</Label>
                        <Select
                          value={formData.payment_terms}
                          onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Full Payment">Full Payment</SelectItem>
                            <SelectItem value="50% Advance">50% Advance</SelectItem>
                            <SelectItem value="Installments">Installments</SelectItem>
                            <SelectItem value="Net 30">Net 30</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment_method">Payment Method</Label>
                        <Select
                          value={formData.payment_method}
                          onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
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
                          value={formData.bank_account}
                          onValueChange={(value) => setFormData({ ...formData, bank_account: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select bank account" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {bankAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.bank_name} - {account.account_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Calculated Summary */}
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Financial Summary</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Base Amount:</span>
                        <p className="font-medium">AED {(parseFloat(formData.deal_value) || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">VAT ({formData.vat_rate}%):</span>
                        <p className="font-medium">
                          AED {((parseFloat(formData.deal_value) || 0) * (parseFloat(formData.vat_rate) || 0) / 100).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <p className="font-medium text-primary">
                          AED {((parseFloat(formData.deal_value) || 0) * (1 + (parseFloat(formData.vat_rate) || 0) / 100)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(`/crm/contracts/${id}`)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default EditContract;