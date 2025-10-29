import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, FileText, DollarSign, Calendar as CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface Worker {
  id: string;
  name: string;
  nationality_code: string;
  job1: string;
  status: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  is_monthly: boolean;
  default_duration_months: number | null;
}

interface Client {
  id: string;
  client_name: string;
  mobile_number: string;
  email: string;
}

interface Deal {
  id: string;
  deal_number: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  service_type: string;
  worker_id: string | null;
  worker_name: string | null;
  deal_value: number;
  total_amount: number;
  status: string;
}

interface ClientData {
  name: string;
  phone: string;
  email: string;
}

const CreateContract = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  
  const [selectedDeal, setSelectedDeal] = useState("");
  const [dealSearchOpen, setDealSearchOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [workerSearchOpen, setWorkerSearchOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientData, setClientData] = useState<ClientData>({ name: "", phone: "", email: "" });
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const defaultEnd = new Date();
    defaultEnd.setFullYear(defaultEnd.getFullYear() + 2);
    return defaultEnd;
  });
  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [durationMonths, setDurationMonths] = useState<number | null>(null);
  const [monthlyAmount, setMonthlyAmount] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  // Fetch workers with status "Ready for Market" or "Available" (but not Reserved or Sold)
  useEffect(() => {
    const fetchWorkers = async () => {
      const { data, error } = await supabase
        .from('workers')
        .select('id, name, nationality_code, job1, status')
        .in('status', ['Ready for Market', 'Available'])
        .order('name');

      if (error) {
        console.error('Error fetching workers:', error);
      } else {
        setWorkers(data || []);
      }
    };

    fetchWorkers();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('product_type', 'contract')
        .order('code');

      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data || []);
      }
    };

    fetchProducts();
  }, []);

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, client_name, mobile_number, email')
        .order('client_name');

      if (error) {
        console.error('Error fetching clients:', error);
      } else {
        setClients(data || []);
      }
    };

    fetchClients();
  }, []);

  // Fetch active deals
  useEffect(() => {
    const fetchDeals = async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .in('status', ['Active', 'Draft'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deals:', error);
      } else {
        setDeals(data || []);
      }
    };

    fetchDeals();
  }, []);

  // Handle deal selection - auto-fill contract data
  const handleDealSelect = (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    if (deal) {
      setSelectedDeal(dealId);
      setClientData({
        name: deal.client_name,
        phone: deal.client_phone,
        email: deal.client_email || ""
      });
      if (deal.worker_id) {
        setSelectedWorker(deal.worker_id);
      }
      setBaseAmount(deal.deal_value);
    }
    setDealSearchOpen(false);
  };

  // Handle client selection
  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClient(clientId);
      setClientData({
        name: client.client_name || "",
        phone: client.mobile_number || "",
        email: client.email || ""
      });
    }
    setClientSearchOpen(false);
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);

  // Calculate VAT and totals
  const vatRate = 5;
  const vatAmount = (baseAmount * vatRate) / 100;
  const totalAmount = baseAmount + vatAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWorker || !selectedProduct || !clientData.name || !clientData.phone || baseAmount <= 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate P4 specific requirements
    if (selectedProductData?.is_monthly && (!durationMonths || !monthlyAmount)) {
      toast({
        title: "Missing Information",
        description: "Please enter duration months and monthly amount for P4 contracts",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate contract number
      const { data: contractNumberData, error: contractNumberError } = await supabase.rpc('generate_contract_number');
      if (contractNumberError) throw contractNumberError;

      // Calculate end date if applicable
      let finalEndDate = endDate.toISOString().split('T')[0];
      if (selectedProductData?.default_duration_months) {
        const end = new Date(startDate);
        end.setMonth(end.getMonth() + selectedProductData.default_duration_months);
        finalEndDate = end.toISOString().split('T')[0];
      } else if (durationMonths) {
        const end = new Date(startDate);
        end.setMonth(end.getMonth() + durationMonths);
        finalEndDate = end.toISOString().split('T')[0];
      }

      // Create contract
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert({
          contract_number: contractNumberData,
          worker_id: selectedWorker,
          product_id: selectedProduct,
          client_name: clientData.name,
          client_phone: clientData.phone,
          client_email: clientData.email,
          salesman_id: user.id,
          start_date: startDate.toISOString().split('T')[0],
          end_date: finalEndDate,
          duration_months: durationMonths,
          monthly_amount: monthlyAmount,
          base_amount: baseAmount,
          vat_rate: vatRate,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          status: 'Active',
          notes: notes,
          created_by: user.id
        })
        .select()
        .single();

      if (contractError) throw contractError;

      // Update worker status to "Sold"
      const { error: workerError } = await supabase
        .from('workers')
        .update({ status: 'Sold' })
        .eq('id', selectedWorker);

      if (workerError) throw workerError;

      // Generate invoice number
      const { data: invoiceNumberData, error: invoiceNumberError } = await supabase.rpc('generate_invoice_number');
      if (invoiceNumberError) throw invoiceNumberError;

      // Create invoice automatically
      const { error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumberData,
          client_name: clientData.name,
          client_phone: clientData.phone,
          client_email: clientData.email,
          subtotal: baseAmount,
          vat_rate: vatRate,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          balance_due: totalAmount,
          status: 'Pending',
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
          notes: `Contract ${contractNumberData}`
        });

      if (invoiceError) throw invoiceError;

      toast({
        title: "Success",
        description: `Contract ${contractNumberData} created successfully with invoice`,
      });

      navigate('/contracts');
    } catch (error: any) {
      console.error('Error creating contract:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create contract",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Create Contract</h1>
            <p className="text-muted-foreground">Create a new client contract and auto-generate invoice</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Deal Selection (Optional - to pre-fill data) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Link to Deal (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Select from Active Deals</Label>
                  <Popover open={dealSearchOpen} onOpenChange={setDealSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={dealSearchOpen}
                        className="w-full justify-between"
                      >
                        {selectedDeal
                          ? `${deals.find((deal) => deal.id === selectedDeal)?.deal_number} - ${deals.find((deal) => deal.id === selectedDeal)?.client_name}`
                          : "Search deals to auto-fill contract data..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 z-50" align="start">
                      <Command>
                        <CommandInput placeholder="Search by deal number or client name..." />
                        <CommandList>
                          <CommandEmpty>No active deals found.</CommandEmpty>
                          <CommandGroup>
                            {deals.map((deal) => (
                              <CommandItem
                                key={deal.id}
                                value={`${deal.deal_number} ${deal.client_name}`}
                                onSelect={() => handleDealSelect(deal.id)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedDeal === deal.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{deal.deal_number} - {deal.client_name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {deal.service_type} • AED {Number(deal.deal_value).toLocaleString()}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    Selecting a deal will auto-fill client info, worker, and amount. You can still modify any field below.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Worker Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Select Worker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Worker *</Label>
                  <Popover open={workerSearchOpen} onOpenChange={setWorkerSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={workerSearchOpen}
                        className="w-full justify-between"
                      >
                        {selectedWorker
                          ? (() => {
                              const worker = workers.find((w) => w.id === selectedWorker);
                              if (worker) {
                                return `${worker.name} - ${worker.nationality_code} (${worker.job1})`;
                              }
                              // If worker not in available list, show from deal data
                              const deal = deals.find(d => d.id === selectedDeal);
                              return deal?.worker_name || "Worker selected (not available in list)";
                            })()
                          : "Search workers..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 z-50" align="start">
                      <Command>
                        <CommandInput placeholder="Search by name, nationality, or job..." />
                        <CommandList>
                          <CommandEmpty>No worker found.</CommandEmpty>
                          <CommandGroup>
                            {workers.map((worker) => (
                              <CommandItem
                                key={worker.id}
                                value={`${worker.name} ${worker.nationality_code} ${worker.job1}`}
                                onSelect={() => {
                                  setSelectedWorker(worker.id);
                                  setWorkerSearchOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedWorker === worker.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {worker.name} - {worker.nationality_code} ({worker.job1})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {workers.length === 0 && (
                    <p className="text-sm text-muted-foreground">No workers available (must be "Ready for Market" or "Available" status, not Reserved or Sold)</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Client Name *</Label>
                  <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={clientSearchOpen}
                        className="w-full justify-between"
                      >
                        {selectedClient
                          ? clients.find((client) => client.id === selectedClient)?.client_name
                          : "Search existing clients or type new..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 z-50" align="start">
                      <Command>
                        <CommandInput placeholder="Search by client name, phone, or email..." />
                        <CommandList>
                          <CommandEmpty>No client found.</CommandEmpty>
                          <CommandGroup>
                            {clients.map((client) => (
                              <CommandItem
                                key={client.id}
                                value={`${client.client_name} ${client.mobile_number} ${client.email}`}
                                onSelect={() => handleClientSelect(client.id)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedClient === client.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{client.client_name}</span>
                                  <span className="text-xs text-muted-foreground">{client.mobile_number}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Input
                    value={clientData.name}
                    onChange={(e) => {
                      setClientData({ ...clientData, name: e.target.value });
                      setSelectedClient("");
                    }}
                    placeholder="Or type client name manually"
                    className="mt-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-phone">Client Phone *</Label>
                  <Input
                    id="client-phone"
                    type="tel"
                    value={clientData.phone}
                    onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                    placeholder="971501234567"
                    pattern="971[0-9]{9}"
                    title="Phone format: 971XXXXXXXXX"
                  />
                  <p className="text-xs text-muted-foreground">Format: 971XXXXXXXXX</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-email">Client Email</Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={clientData.email}
                    onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contract Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Contract Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Product Type *</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.code} - {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(startDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          if (date) {
                            setStartDate(date);
                            // Auto-update end date to be 2 years from new start date
                            const newEnd = new Date(date);
                            newEnd.setFullYear(newEnd.getFullYear() + 2);
                            setEndDate(newEnd);
                          }
                        }}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(endDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {selectedProductData?.is_monthly && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (Months) *</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        value={durationMonths || ""}
                        onChange={(e) => setDurationMonths(parseInt(e.target.value) || null)}
                        placeholder="Enter number of months"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthly-amount">Monthly Amount (AED) *</Label>
                      <Input
                        id="monthly-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={monthlyAmount || ""}
                        onChange={(e) => {
                          const monthly = parseFloat(e.target.value) || 0;
                          setMonthlyAmount(monthly);
                          if (durationMonths) {
                            setBaseAmount(monthly * durationMonths);
                          }
                        }}
                        placeholder="Enter monthly amount"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="base-amount">Base Amount (AED) *</Label>
                  <Input
                    id="base-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={baseAmount || ""}
                    onChange={(e) => setBaseAmount(parseFloat(e.target.value) || 0)}
                    placeholder="Enter base amount"
                    disabled={selectedProductData?.is_monthly}
                  />
                  <p className="text-sm text-muted-foreground">Amount excluding VAT</p>
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
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Base Amount:</span>
                  <span className="font-medium">AED {baseAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>VAT (5%):</span>
                  <span className="font-medium">AED {vatAmount.toLocaleString()}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount:</span>
                  <span className="text-primary">AED {totalAmount.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/contracts')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Contract & Invoice
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateContract;
