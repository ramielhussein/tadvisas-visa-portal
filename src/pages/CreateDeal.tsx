import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { ArrowLeft, Search } from "lucide-react";
import { z } from "zod";

const dealSchema = z.object({
  client_name: z.string().min(1, "Client name is required").max(200),
  client_phone: z.string().min(1, "Phone is required").max(20),
  client_email: z.string().email("Invalid email").max(255).optional().or(z.literal("")),
  service_type: z.string().min(1, "Service type is required"),
  service_description: z.string().max(1000).optional(),
  deal_value: z.number().min(0, "Deal value must be positive"),
  vat_rate: z.number().min(0).max(100),
  payment_terms: z.string(),
  commission_rate: z.number().min(0).max(100),
  notes: z.string().max(2000).optional(),
});

const CreateDeal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchLeadQuery, setSearchLeadQuery] = useState("");
  const [searchWorkerQuery, setSearchWorkerQuery] = useState("");
  const [leads, setLeads] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  useEffect(() => {
    fetchPaymentMethods();
    fetchBankAccounts();
  }, []);

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
    commission_rate: "0",
    notes: "",
  });

  const [calculatedAmounts, setCalculatedAmounts] = useState({
    vat_amount: 0,
    total_amount: 0,
    commission_amount: 0,
    payment_commission: 0,
    net_amount: 0,
  });

  useEffect(() => {
    const dealValue = parseFloat(formData.deal_value) || 0;
    const vatRate = parseFloat(formData.vat_rate) || 0;
    const commissionRate = parseFloat(formData.commission_rate) || 0;

    const vat_amount = (dealValue * vatRate) / 100;
    const total_amount = dealValue + vat_amount;
    const commission_amount = (dealValue * commissionRate) / 100;

    // Calculate payment commission
    const selectedMethod = paymentMethods.find(m => m.method_name === formData.payment_method);
    const paymentCommissionRate = selectedMethod?.commission_rate || 0;
    const payment_commission = (total_amount * paymentCommissionRate) / 100;
    const net_amount = total_amount - payment_commission;

    setCalculatedAmounts({ 
      vat_amount, 
      total_amount, 
      commission_amount,
      payment_commission,
      net_amount
    });
  }, [formData.deal_value, formData.vat_rate, formData.commission_rate, formData.payment_method, paymentMethods]);

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

  const searchLeads = async (query: string) => {
    if (query.length < 2) {
      setLeads([]);
      return;
    }

    const { data } = await supabase
      .from("leads")
      .select("*")
      .or(`client_name.ilike.%${query}%,mobile_number.ilike.%${query}%`)
      .limit(10);

    setLeads(data || []);
  };

  const searchWorkers = async (query: string) => {
    if (query.length < 2) {
      setWorkers([]);
      return;
    }

    const { data } = await supabase
      .from("workers")
      .select("*")
      .or(`name.ilike.%${query}%,passport_no.ilike.%${query}%`)
      .limit(10);

    setWorkers(data || []);
  };

  const selectLead = (lead: any) => {
    setSelectedLead(lead);
    setFormData({
      ...formData,
      client_name: lead.client_name || "",
      client_phone: lead.mobile_number || "",
      client_email: lead.email || "",
      service_type: lead.service_required || "",
    });
    setSearchLeadQuery("");
    setLeads([]);
  };

  const selectWorker = (worker: any) => {
    setSelectedWorker(worker);
    setSearchWorkerQuery("");
    setWorkers([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate
      const validated = dealSchema.parse({
        client_name: formData.client_name.trim(),
        client_phone: formData.client_phone.trim(),
        client_email: formData.client_email.trim() || undefined,
        service_type: formData.service_type,
        service_description: formData.service_description.trim() || undefined,
        deal_value: parseFloat(formData.deal_value),
        vat_rate: parseFloat(formData.vat_rate),
        payment_terms: formData.payment_terms,
        commission_rate: parseFloat(formData.commission_rate),
        notes: formData.notes.trim() || undefined,
      });

      setLoading(true);

      // Get deal number
      const { data: dealNumber } = await supabase.rpc('generate_deal_number');

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Create deal
      const { data: newDeal, error } = await supabase
        .from("deals")
        .insert({
          deal_number: dealNumber,
          lead_id: selectedLead?.id || null,
          client_name: validated.client_name,
          client_phone: validated.client_phone,
          client_email: validated.client_email || null,
          worker_id: selectedWorker?.id || null,
          worker_name: selectedWorker?.name || null,
          service_type: validated.service_type,
          service_description: validated.service_description || null,
          deal_value: validated.deal_value,
          vat_rate: validated.vat_rate,
          vat_amount: calculatedAmounts.vat_amount,
          total_amount: calculatedAmounts.total_amount,
          payment_terms: validated.payment_terms,
          commission_rate: validated.commission_rate,
          commission_amount: calculatedAmounts.commission_amount,
          notes: validated.notes || null,
          assigned_to: user?.id,
          status: "Draft",
        })
        .select()
        .single();

      if (error) throw error;

      // Update lead status to SOLD if selected
      if (selectedLead) {
        await supabase
          .from("leads")
          .update({ 
            status: "SOLD",
            client_converted: true
          })
          .eq("id", selectedLead.id);
      }

      toast({
        title: "Success!",
        description: `Deal ${dealNumber} created successfully`,
      });

      navigate(`/deals/${newDeal.id}`);
    } catch (error: any) {
      console.error("Error creating deal:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create deal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="ghost" onClick={() => navigate("/deals")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deals
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Create New Deal</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Link to Lead */}
                <div className="space-y-2">
                  <Label>Link to Existing Lead (Optional)</Label>
                  {selectedLead ? (
                    <div className="p-3 bg-primary/10 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium">{selectedLead.client_name}</p>
                        <p className="text-sm text-muted-foreground">{selectedLead.mobile_number}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLead(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search leads by name or phone..."
                        value={searchLeadQuery}
                        onChange={(e) => {
                          setSearchLeadQuery(e.target.value);
                          searchLeads(e.target.value);
                        }}
                        className="pl-10"
                      />
                      {leads.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {leads.map((lead) => (
                            <div
                              key={lead.id}
                              className="p-3 hover:bg-accent cursor-pointer border-b last:border-0"
                              onClick={() => selectLead(lead)}
                            >
                              <p className="font-medium">{lead.client_name || "Unnamed"}</p>
                              <p className="text-sm text-muted-foreground">{lead.mobile_number}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Client Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Client Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="client_name">Client Name *</Label>
                      <Input
                        id="client_name"
                        required
                        value={formData.client_name}
                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_phone">Phone *</Label>
                      <Input
                        id="client_phone"
                        required
                        value={formData.client_phone}
                        onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client_email">Email</Label>
                    <Input
                      id="client_email"
                      type="email"
                      value={formData.client_email}
                      onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Link to Worker/CV */}
                <div className="space-y-2">
                  <Label>Link to Worker/CV (Optional)</Label>
                  {selectedWorker ? (
                    <div className="p-3 bg-primary/10 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium">{selectedWorker.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedWorker.nationality_code} - {selectedWorker.job1}</p>
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
                        placeholder="Search workers by name or passport..."
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
                              onClick={() => selectWorker(worker)}
                            >
                              <p className="font-medium">{worker.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {worker.nationality_code} - {worker.job1}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Service Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Service Details</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="service_type">Service Type *</Label>
                    <Select
                      value={formData.service_type}
                      onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P1 Traditional Package">P1 Traditional Package</SelectItem>
                        <SelectItem value="P4 Monthly">P4 Monthly</SelectItem>
                        <SelectItem value="P5 Tadvisas">P5 Tadvisas</SelectItem>
                        <SelectItem value="P5 Tadvisas+">P5 Tadvisas+</SelectItem>
                        <SelectItem value="P5 Tadvisas++">P5 Tadvisas++</SelectItem>
                        <SelectItem value="Driver">Driver</SelectItem>
                        <SelectItem value="Cook">Cook</SelectItem>
                        <SelectItem value="Caregiver">Caregiver</SelectItem>
                        <SelectItem value="Nurse">Nurse</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service_description">Description</Label>
                    <Textarea
                      id="service_description"
                      value={formData.service_description}
                      onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Financial Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Financial Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deal_value">Deal Value (AED) *</Label>
                      <Input
                        id="deal_value"
                        type="number"
                        step="0.01"
                        required
                        value={formData.deal_value}
                        onChange={(e) => setFormData({ ...formData, deal_value: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vat_rate">VAT Rate (%)</Label>
                      <Input
                        id="vat_rate"
                        type="number"
                        step="0.01"
                        value={formData.vat_rate}
                        onChange={(e) => setFormData({ ...formData, vat_rate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">AED {parseFloat(formData.deal_value || "0").toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT Amount:</span>
                      <span className="font-medium">AED {calculatedAmounts.vat_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total Amount:</span>
                      <span>AED {calculatedAmounts.total_amount.toFixed(2)}</span>
                    </div>
                    {calculatedAmounts.payment_commission > 0 && (
                      <>
                        <div className="flex justify-between text-orange-600">
                          <span>Payment Commission:</span>
                          <span>- AED {calculatedAmounts.payment_commission.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-green-600 font-bold">
                          <span>Net Amount (after fees):</span>
                          <span>AED {calculatedAmounts.net_amount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="payment_method">Payment Method *</Label>
                      <Select
                        value={formData.payment_method}
                        onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.method_name}>
                              {method.method_name} {method.commission_rate > 0 ? `(${method.commission_rate}% fee)` : ''}
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
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts.map((bank) => (
                            <SelectItem key={bank.id} value={bank.id}>
                              {bank.bank_name} - {bank.account_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem value="50% Upfront">50% Upfront</SelectItem>
                          <SelectItem value="Installments">Installments</SelectItem>
                          <SelectItem value="Net 30">Net 30</SelectItem>
                          <SelectItem value="Net 60">Net 60</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                      <Input
                        id="commission_rate"
                        type="number"
                        step="0.01"
                        value={formData.commission_rate}
                        onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                      />
                    </div>
                  </div>

                  {parseFloat(formData.commission_rate) > 0 && (
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <span className="text-sm">Commission Amount: </span>
                      <span className="font-medium">AED {calculatedAmounts.commission_amount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/deals")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Deal"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CreateDeal;
