import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { ArrowLeft, Loader2, Plus, Trash2, User, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ServiceItem {
  service_type: string;
  service_description: string;
  amount: string;
}

const EditContract = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deal, setDeal] = useState<any>(null);

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");

  const [formData, setFormData] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    deal_date: "",
    vat_rate: "5",
    payment_terms: "Full Payment",
    payment_method: "",
    bank_account: "",
    paid_amount: "0",
    notes: "",
  });

  const [services, setServices] = useState<ServiceItem[]>([
    { service_type: "", service_description: "", amount: "0" }
  ]);

  useEffect(() => {
    if (id) {
      fetchDeal();
      fetchPaymentMethods();
      fetchBankAccounts();
      fetchWorkers();
    }
  }, [id]);

  const fetchWorkers = async () => {
    const { data } = await supabase
      .from("workers")
      .select("id, full_name, nationality_code, passport_no")
      .order("full_name");
    setWorkers(data || []);
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
      setSelectedWorkerId(data.worker_id || "");

      // Parse services from service_description JSON or create single service
      let parsedServices: ServiceItem[] = [];
      try {
        const parsed = JSON.parse(data.service_description || "[]");
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsedServices = parsed.map((s: any) => ({
            service_type: s.service_type || data.service_type || "",
            service_description: s.service_description || "",
            amount: s.amount?.toString() || "0"
          }));
        }
      } catch {
        // If not valid JSON, create single service from deal
        parsedServices = [{
          service_type: data.service_type || "",
          service_description: data.service_description || "",
          amount: data.deal_value?.toString() || "0"
        }];
      }

      if (parsedServices.length === 0) {
        parsedServices = [{
          service_type: data.service_type || "",
          service_description: "",
          amount: data.deal_value?.toString() || "0"
        }];
      }

      setServices(parsedServices);

      setFormData({
        client_name: data.client_name || "",
        client_phone: data.client_phone || "",
        client_email: data.client_email || "",
        deal_date: data.deal_date 
          ? data.deal_date 
          : data.created_at 
            ? format(new Date(data.created_at), "yyyy-MM-dd") 
            : format(new Date(), "yyyy-MM-dd"),
        vat_rate: data.vat_rate?.toString() || "5",
        payment_terms: data.payment_terms || "Full Payment",
        payment_method: (data as any).payment_method || "",
        bank_account: (data as any).bank_account_id || "",
        paid_amount: data.paid_amount?.toString() || "0",
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

  const addService = () => {
    setServices([...services, { service_type: "", service_description: "", amount: "0" }]);
  };

  const removeService = (index: number) => {
    if (services.length === 1) {
      toast({
        title: "Cannot remove",
        description: "At least one service is required",
        variant: "destructive",
      });
      return;
    }
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof ServiceItem, value: string) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const calculateTotals = () => {
    const dealValue = services.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
    const vatRate = parseFloat(formData.vat_rate) || 0;
    const vatAmount = (dealValue * vatRate) / 100;
    const totalAmount = dealValue + vatAmount;
    return { dealValue, vatAmount, totalAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate services
      const validServices = services.filter(s => s.service_type.trim());
      if (validServices.length === 0) {
        throw new Error("At least one service with a type is required");
      }

      const { dealValue, vatAmount, totalAmount } = calculateTotals();

      // Prepare service description as JSON
      const serviceDescriptionJson = JSON.stringify(validServices.map(s => ({
        service_type: s.service_type.trim(),
        service_description: s.service_description.trim(),
        amount: parseFloat(s.amount) || 0
      })));

      // Get primary service type (first service)
      const primaryServiceType = validServices[0].service_type;

      const paidAmount = parseFloat(formData.paid_amount) || 0;

      // Get worker name if worker is selected
      const selectedWorker = workers.find(w => w.id === selectedWorkerId);
      const workerName = selectedWorker ? selectedWorker.full_name : null;

      const { error } = await supabase
        .from("deals")
        .update({
          client_name: formData.client_name.trim(),
          client_phone: formData.client_phone.trim(),
          client_email: formData.client_email.trim() || null,
          service_type: primaryServiceType,
          service_description: serviceDescriptionJson,
          deal_value: dealValue,
          vat_rate: parseFloat(formData.vat_rate) || 5,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          payment_terms: formData.payment_terms,
          notes: formData.notes.trim() || null,
          deal_date: formData.deal_date,
          worker_id: selectedWorkerId || null,
          worker_name: workerName,
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

  const { dealValue, vatAmount, totalAmount } = calculateTotals();

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
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                    <div className="space-y-2">
                      <Label htmlFor="client_email">Client Email</Label>
                      <Input
                        id="client_email"
                        type="email"
                        value={formData.client_email}
                        onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deal_date">Deal Date *</Label>
                      <Input
                        id="deal_date"
                        type="date"
                        value={formData.deal_date}
                        onChange={(e) => setFormData({ ...formData, deal_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="worker">Domestic Worker</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {selectedWorkerId && selectedWorkerId !== "none" ? (
                              <span className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {workers.find(w => w.id === selectedWorkerId)?.full_name || "Select a worker"}
                              </span>
                            ) : (
                              "Select a worker to link"
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0 bg-background border shadow-lg z-50">
                          <Command>
                            <CommandInput placeholder="Search workers by name..." />
                            <CommandList>
                              <CommandEmpty>No worker found.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="none"
                                  onSelect={() => setSelectedWorkerId("")}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      !selectedWorkerId ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  No worker linked
                                </CommandItem>
                                {workers.map((worker) => (
                                  <CommandItem
                                    key={worker.id}
                                    value={`${worker.full_name} ${worker.nationality_code || ''} ${worker.passport_no || ''}`}
                                    onSelect={() => setSelectedWorkerId(worker.id)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedWorkerId === worker.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <span className="flex-1">
                                      {worker.full_name}
                                      {worker.nationality_code && <span className="text-muted-foreground ml-1">({worker.nationality_code})</span>}
                                      {worker.passport_no && <span className="text-muted-foreground ml-1">- {worker.passport_no}</span>}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {deal?.worker_name && !selectedWorkerId && (
                        <p className="text-sm text-muted-foreground">
                          Previously linked: {deal.worker_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Services Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-semibold text-lg">Services</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addService}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Service
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {services.map((service, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Service {index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeService(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label>Service Type *</Label>
                            <Input
                              value={service.service_type}
                              onChange={(e) => updateService(index, "service_type", e.target.value)}
                              placeholder="e.g., Housemaid, Nanny"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                              value={service.service_description}
                              onChange={(e) => updateService(index, "service_description", e.target.value)}
                              placeholder="Additional details"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Amount (AED) *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={service.amount}
                              onChange={(e) => updateService(index, "amount", e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Payment Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="space-y-2">
                      <Label htmlFor="paid_amount">Received Amount (AED)</Label>
                      <Input
                        id="paid_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.paid_amount}
                        onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                      />
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Base Amount:</span>
                      <p className="font-medium">AED {dealValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">VAT ({formData.vat_rate}%):</span>
                      <p className="font-medium">AED {vatAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <p className="font-medium text-primary">AED {totalAmount.toLocaleString()}</p>
                    </div>
                    {deal?.paid_amount > 0 && (
                      <div>
                        <span className="text-muted-foreground">Balance Due:</span>
                        <p className="font-medium text-orange-600">
                          AED {(totalAmount - (deal.paid_amount || 0)).toLocaleString()}
                        </p>
                      </div>
                    )}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default EditContract;
