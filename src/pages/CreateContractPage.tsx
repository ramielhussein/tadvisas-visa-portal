import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { ArrowLeft, Search, Paperclip, X, CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { cn } from "@/lib/utils";
import html2pdf from "html2pdf.js";

const contractSchema = z.object({
  client_name: z.string().min(1, "Client name is required").max(200),
  client_phone: z.string().min(1, "Phone is required").max(20),
  client_email: z.string().email("Invalid email").max(255).optional().or(z.literal("")),
  service_type: z.string().min(1, "Service type is required"),
  service_description: z.string().max(1000).optional(),
  deal_value: z.number().min(0, "Contract value must be positive"),
  vat_rate: z.number().min(0).max(100),
  commission_rate: z.number().min(0).max(100),
  notes: z.string().max(2000).optional(),
});

const CreateContract = () => {
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
  const [salesPackages, setSalesPackages] = useState<any[]>([]);
const [currentUserId, setCurrentUserId] = useState<string>("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [salespeople, setSalespeople] = useState<any[]>([]);
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<string>("");
  const [services, setServices] = useState<Array<{
    id: string;
    service_type: string;
    service_description: string;
    amount: string;
    // P4 Monthly fields
    p4_months?: string;
    p4_monthly_rate?: string;
    p4_start_date?: Date;
    p4_end_date?: Date;
  }>>([{
    id: crypto.randomUUID(),
    service_type: "",
    service_description: "",
    amount: "0"
  }]);

  useEffect(() => {
    fetchPaymentMethods();
    fetchBankAccounts();
    fetchSalesPackages();
    fetchCurrentUser();
    fetchSalespeople();
  }, []);

  const [dealDate, setDealDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    vat_rate: "5",
    payment_method: "",
    bank_account: "",
    commission_rate: "0",
    received_amount: "0",
    notes: "",
  });

  const [calculatedAmounts, setCalculatedAmounts] = useState({
    vat_amount: 0,
    total_amount: 0,
    commission_amount: 0,
    payment_commission: 0,
    net_amount: 0,
    base_amount: 0,
    balance_amount: 0,
  });

  useEffect(() => {
    // Calculate total from all services (VAT inclusive amounts)
    const totalIncludingVat = services.reduce((sum, service) => sum + (parseFloat(service.amount) || 0), 0);
    const vatRate = parseFloat(formData.vat_rate) || 0;
    const commissionRate = parseFloat(formData.commission_rate) || 0;
    const receivedAmount = parseFloat(formData.received_amount) || 0;

    // Reverse calculate: base amount = total / (1 + VAT%)
    const base_amount = totalIncludingVat / (1 + vatRate / 100);
    const vat_amount = totalIncludingVat - base_amount;
    const total_amount = totalIncludingVat;
    const commission_amount = (base_amount * commissionRate) / 100;
    const balance_amount = total_amount - receivedAmount;

    setCalculatedAmounts({ 
      vat_amount, 
      total_amount, 
      commission_amount,
      payment_commission: 0,
      net_amount: total_amount,
      base_amount,
      balance_amount
    });
  }, [services, formData.vat_rate, formData.commission_rate, formData.received_amount]);

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

  const fetchSalesPackages = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("code");
    
    setSalesPackages(data || []);
  };

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      setSelectedSalespersonId(user.id); // Default to current user
    }
  };

  const fetchSalespeople = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name");
    setSalespeople(data || []);
  };

  const searchLeads = async (query: string) => {
    if (query.length < 2) {
      setLeads([]);
      return;
    }

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .or(`client_name.ilike.%${query}%,mobile_number.ilike.%${query}%,email.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error searching leads:", error);
      toast({
        title: "Error",
        description: "Failed to search leads",
        variant: "destructive",
      });
    }

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
      .or(`name.ilike.%${query}%,passport_no.ilike.%${query}%,center_ref.ilike.%${query}%`)
      .in("status", ["Available", "Ready for Market", "Approved"])
      .eq("staff", false)
      .order("created_at", { ascending: false })
      .limit(15);

    setWorkers(data || []);
  };

  const selectLead = (lead: any) => {
    setSelectedLead(lead);
    setFormData({
      ...formData,
      client_name: lead.client_name || "",
      client_phone: lead.mobile_number || "",
      client_email: lead.email || "",
    });
    // Update first service if it's empty
    if (lead.service_required && services[0] && !services[0].service_type) {
      const updatedServices = [...services];
      updatedServices[0].service_type = lead.service_required;
      setServices(updatedServices);
    }
    setSearchLeadQuery("");
    setLeads([]);
  };

  const selectWorker = (worker: any) => {
    setSelectedWorker(worker);
    setSearchWorkerQuery("");
    setWorkers([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const addService = () => {
    setServices([...services, {
      id: crypto.randomUUID(),
      service_type: "",
      service_description: "",
      amount: "0",
      p4_months: "",
      p4_monthly_rate: "",
      p4_start_date: undefined,
      p4_end_date: undefined
    }]);
  };

  const removeService = (id: string) => {
    if (services.length > 1) {
      setServices(services.filter(s => s.id !== id));
    }
  };

  const updateService = (id: string, field: string, value: string | Date | undefined) => {
    setServices(services.map(s => {
      if (s.id !== id) return s;
      
      const updated = { ...s, [field]: value };
      
      // Auto-calculate end date when P4 months or start date changes
      if ((field === 'p4_months' || field === 'p4_start_date') && updated.p4_start_date && updated.p4_months) {
        const months = parseInt(updated.p4_months as string) || 0;
        if (months > 0) {
          const endDate = new Date(updated.p4_start_date);
          endDate.setMonth(endDate.getMonth() + months);
          endDate.setDate(endDate.getDate() - 1); // End date is last day of the period
          updated.p4_end_date = endDate;
        }
      }
      
      // Auto-calculate total amount for P4 Monthly: months × monthly rate
      if ((field === 'p4_months' || field === 'p4_monthly_rate') && isP4Monthly(updated.service_type)) {
        const months = parseInt(updated.p4_months as string) || 0;
        const monthlyRate = parseFloat(updated.p4_monthly_rate as string) || 0;
        if (months > 0 && monthlyRate > 0) {
          updated.amount = (months * monthlyRate).toString();
        }
      }
      
      return updated;
    }));
  };

  // Helper to check if service is P4 Monthly
  const isP4Monthly = (serviceType: string) => {
    return serviceType.toLowerCase().includes('p4') || 
           serviceType.toLowerCase().includes('monthly');
  };

  const generateDealSheetHTML = (deal: any) => {
    return `
      <div style="padding: 20px 25px; font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; font-size: 11px;">
        <!-- Header with Logo -->
        <div style="margin-bottom: 12px; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px;">
          <table style="width: 100%;">
            <tr>
              <td style="width: 50%;">
                <img src="https://tadmaids.com/lovable-uploads/4e5c7620-b6a4-438c-a61b-eaa4f96ea0c2.png" alt="TADMAIDS" style="height: 35px; width: auto;" />
              </td>
              <td style="width: 50%; text-align: right; font-size: 10px; color: #666;">
                <p style="margin: 1px 0;">+97143551186 | tadbeer@tadmaids.com</p>
                <p style="margin: 1px 0;">Tadmaids Center, Dubai, UAE</p>
              </td>
            </tr>
          </table>
        </div>

        <!-- Document Title & Deal Info in one row -->
        <div style="margin-bottom: 12px; background-color: #f0f4f8; padding: 10px; border-radius: 6px;">
          <table style="width: 100%;">
            <tr>
              <td style="width: 50%;"><strong style="font-size: 14px; color: #1e3a5f;">DEAL SHEET</strong></td>
              <td style="text-align: right;"><strong>Deal #:</strong> ${deal.deal_number} | <strong>Date:</strong> ${format(new Date(deal.created_at), "dd MMM yyyy")}</td>
            </tr>
          </table>
        </div>

        <!-- Client Information - Compact -->
        <div style="margin-bottom: 12px; background-color: #f9f9f9; padding: 10px; border-radius: 6px; border-left: 3px solid #1e3a5f;">
          <table style="width: 100%;">
            <tr>
              <td style="width: 33%;"><strong>Client:</strong> ${deal.client_name}</td>
              <td style="width: 33%;"><strong>Phone:</strong> ${deal.client_phone}</td>
              <td style="width: 34%;">${deal.client_email ? `<strong>Email:</strong> ${deal.client_email}` : ''}</td>
            </tr>
          </table>
        </div>

        <!-- Services Table - Compact -->
        <div style="margin-bottom: 12px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
              <tr style="background-color: #1e3a5f; color: white;">
                <th style="padding: 6px; text-align: left; border: 1px solid #ddd; width: 5%;">#</th>
                <th style="padding: 6px; text-align: left; border: 1px solid #ddd; width: 30%;">Service</th>
                <th style="padding: 6px; text-align: left; border: 1px solid #ddd; width: 45%;">Description</th>
                <th style="padding: 6px; text-align: right; border: 1px solid #ddd; width: 20%;">Amount (AED)</th>
              </tr>
            </thead>
            <tbody>
              ${JSON.parse(deal.service_description).map((service: any, index: number) => `
                <tr style="background-color: ${index % 2 === 0 ? '#fff' : '#f9f9f9'};">
                  <td style="padding: 5px; border: 1px solid #ddd;">${index + 1}</td>
                  <td style="padding: 5px; border: 1px solid #ddd;"><strong>${service.service_type}</strong></td>
                  <td style="padding: 5px; border: 1px solid #ddd;">${service.service_description || '-'}</td>
                  <td style="padding: 5px; text-align: right; border: 1px solid #ddd;">${parseFloat(service.amount).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Financial Summary - Compact side by side with Payment Terms -->
        <div style="margin-bottom: 12px;">
          <table style="width: 100%;">
            <tr>
              <td style="width: 60%; vertical-align: top; padding-right: 15px;">
                <div style="background-color: #f0f4f8; padding: 10px; border-radius: 6px;">
                  <table style="width: 100%; font-size: 10px;">
                    <tr>
                      <td style="padding: 3px;"><strong>Subtotal (Excl. VAT):</strong></td>
                      <td style="padding: 3px; text-align: right;">AED ${deal.deal_value.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 3px;"><strong>VAT (${deal.vat_rate}%):</strong></td>
                      <td style="padding: 3px; text-align: right;">AED ${deal.vat_amount.toFixed(2)}</td>
                    </tr>
                    <tr style="background-color: #1e3a5f; color: white;">
                      <td style="padding: 6px;"><strong>TOTAL:</strong></td>
                      <td style="padding: 6px; text-align: right;"><strong>AED ${deal.total_amount.toFixed(2)}</strong></td>
                    </tr>
                    ${deal.paid_amount > 0 ? `
                      <tr><td style="padding: 3px; color: #16a34a;"><strong>Paid:</strong></td><td style="text-align: right; color: #16a34a;">AED ${deal.paid_amount.toFixed(2)}</td></tr>
                      <tr><td style="padding: 3px; color: #ea580c;"><strong>Balance:</strong></td><td style="text-align: right; color: #ea580c;"><strong>AED ${deal.balance_due.toFixed(2)}</strong></td></tr>
                    ` : ''}
                  </table>
                </div>
              </td>
              <td style="width: 40%; vertical-align: top;">
                <div style="font-size: 10px;">
                  ${deal.notes ? `<p style="margin: 0;"><strong>Notes:</strong> ${deal.notes}</p>` : ''}
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Terms - Very Compact -->
        <div style="margin-bottom: 15px; font-size: 9px; color: #666; background-color: #f9f9f9; padding: 8px; border-radius: 4px;">
          <strong style="color: #1e3a5f;">Terms:</strong> This agreement is valid for services specified. Payment terms must be adhered to. Changes require written agreement by both parties.
        </div>

        <!-- Signatures - Compact -->
        <div style="margin-top: 20px;">
          <table style="width: 100%;">
            <tr>
              <td style="width: 45%; vertical-align: bottom;">
                <div style="border-top: 1px solid #1e3a5f; padding-top: 5px; margin-top: 30px;">
                  <p style="margin: 0; font-size: 10px; color: #1e3a5f;"><strong>Client Signature</strong></p>
                  <p style="margin: 2px 0; font-size: 9px; color: #666;">${deal.client_name} | Date: ___________</p>
                </div>
              </td>
              <td style="width: 10%;"></td>
              <td style="width: 45%; vertical-align: bottom;">
                <div style="border-top: 1px solid #1e3a5f; padding-top: 5px; margin-top: 30px;">
                  <p style="margin: 0; font-size: 10px; color: #1e3a5f;"><strong>TADMAIDS Representative</strong></p>
                  <p style="margin: 2px 0; font-size: 9px; color: #666;">Name: ___________ | Date: ___________</p>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Footer - Minimal -->
        <div style="margin-top: 15px; text-align: center; font-size: 8px; color: #999; border-top: 1px solid #eee; padding-top: 8px;">
          TADMAIDS | +97143551186 | tadbeer@tadmaids.com | Tadmaids Center, Dubai, UAE
        </div>
      </div>
    `;
  };

  const generateDealSheetPDF = async (deal: any) => {
    const dealSheetHTML = generateDealSheetHTML(deal);

    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `Deal_${deal.deal_number}_${format(new Date(), "yyyyMMdd")}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    try {
      await html2pdf().set(opt).from(dealSheetHTML).save();
      toast({
        title: "Success!",
        description: "Deal sheet PDF downloaded successfully",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate at least one service
      if (services.length === 0 || services.every(s => !s.service_type)) {
        toast({
          title: "Validation Error",
          description: "Please add at least one service",
          variant: "destructive",
        });
        return;
      }

      // Validate
      const validated = contractSchema.parse({
        client_name: formData.client_name.trim(),
        client_phone: formData.client_phone.trim(),
        client_email: formData.client_email.trim() || undefined,
        service_type: services.map(s => s.service_type).filter(Boolean).join(", "),
        service_description: JSON.stringify(services),
        deal_value: calculatedAmounts.base_amount,
        vat_rate: parseFloat(formData.vat_rate) || 0,
        commission_rate: parseFloat(formData.commission_rate) || 0,
        notes: formData.notes.trim() || undefined,
      });

      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Upload attachments
      const uploadedAttachments = [];
      for (const file of attachments) {
        const fileExt = file.name.split('.').pop();
        const fileName = `deal_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `deals/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('crm-documents')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          continue;
        }

        // Store private path (not public URL)
        uploadedAttachments.push({
          name: file.name,
          path: filePath,
          uploaded_at: new Date().toISOString(),
          uploaded_by: user?.id || '',
        });
      }

      // Extract start/end dates from services (for P4 Monthly or set defaults)
      let startDate: string | null = null;
      let endDate: string | null = null;
      let reminderDays = 3; // Default for P4 Monthly

      // Check if any service is P4/Monthly
      const p4Service = services.find(s => isP4Monthly(s.service_type));
      if (p4Service && p4Service.p4_start_date) {
        startDate = format(p4Service.p4_start_date, 'yyyy-MM-dd');
        if (p4Service.p4_end_date) {
          endDate = format(p4Service.p4_end_date, 'yyyy-MM-dd');
        }
        reminderDays = 3; // P4 Monthly gets 3-day reminder
      } else {
        // For non-monthly deals like P5, set start date to deal date
        startDate = format(dealDate, 'yyyy-MM-dd');
        // P5 and other packages get 30-day reminder
        reminderDays = 30;
      }

      // Create deal
      const { data: newDeal, error } = await supabase
        .from("deals")
        .insert({
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
          commission_rate: validated.commission_rate,
          commission_amount: calculatedAmounts.commission_amount,
          paid_amount: parseFloat(formData.received_amount) || 0,
          notes: validated.notes || null,
          assigned_to: selectedSalespersonId || currentUserId || user?.id,
          status: "Draft",
          attachments: uploadedAttachments,
          // Format date correctly accounting for timezone - use local date components
          deal_date: `${dealDate.getFullYear()}-${String(dealDate.getMonth() + 1).padStart(2, '0')}-${String(dealDate.getDate()).padStart(2, '0')}`,
          start_date: startDate,
          end_date: endDate,
          reminder_days_before: reminderDays,
        } as any)
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
        description: `Deal ${newDeal.deal_number} created successfully`,
      });

      // Ask user if they want to download deal sheet
      const downloadSheet = window.confirm("Deal created successfully! Would you like to download the Deal Sheet PDF?");
      
      if (downloadSheet) {
        await generateDealSheetPDF(newDeal);
      }

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
          <Button variant="ghost" onClick={() => navigate("/crm/contracts")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contracts
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Create New Deal</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Deal Date */}
                <div className="space-y-2">
                  <Label>Deal Date *</Label>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dealDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dealDate ? format(dealDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dealDate}
                        onSelect={(date) => {
                          if (date) {
                            setDealDate(date);
                            setDatePickerOpen(false);
                          }
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Salesperson */}
                <div className="space-y-2">
                  <Label>Salesperson *</Label>
                  <Select
                    value={selectedSalespersonId}
                    onValueChange={setSelectedSalespersonId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select salesperson" />
                    </SelectTrigger>
                    <SelectContent>
                      {salespeople.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.full_name || person.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                              <p className="font-medium">{lead.client_name || "No Name Set"}</p>
                              <p className="text-sm text-muted-foreground">
                                📱 {lead.mobile_number}
                                {lead.email && ` • 📧 ${lead.email}`}
                              </p>
                              {lead.service_required && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Service: {lead.service_required}
                                </p>
                              )}
                              {lead.emirate && (
                                <p className="text-xs text-muted-foreground">
                                  Location: {lead.emirate}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {searchLeadQuery.length >= 2 && leads.length === 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg p-3 text-sm text-muted-foreground">
                          No leads found matching "{searchLeadQuery}"
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
                        type="tel"
                        required
                        value={formData.client_phone}
                        onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                        placeholder="971501234567"
                        pattern="971[0-9]{9}"
                        title="Phone format: 971XXXXXXXXX"
                      />
                      <p className="text-xs text-muted-foreground">Format: 971XXXXXXXXX</p>
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

                {/* Link to Domestic Worker/CV */}
                <div className="space-y-2">
                  <Label>Link to Domestic Worker (Optional)</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Search and link this deal to an existing domestic worker CV
                  </p>
                  {selectedWorker ? (
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{selectedWorker.name}</p>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Passport:</span>
                              <span className="ml-1 font-medium">{selectedWorker.passport_no}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Ref:</span>
                              <span className="ml-1 font-medium">{selectedWorker.center_ref}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Nationality:</span>
                              <span className="ml-1 font-medium">{selectedWorker.nationality_code}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Primary Job:</span>
                              <span className="ml-1 font-medium">{selectedWorker.job1}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedWorker(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, passport, or reference number..."
                        value={searchWorkerQuery}
                        onChange={(e) => {
                          setSearchWorkerQuery(e.target.value);
                          searchWorkers(e.target.value);
                        }}
                        className="pl-10"
                      />
                      {workers.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-72 overflow-y-auto">
                          {workers.map((worker) => (
                            <div
                              key={worker.id}
                              className="p-3 hover:bg-accent cursor-pointer border-b last:border-0 transition-colors"
                              onClick={() => selectWorker(worker)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium">{worker.name}</p>
                                  <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
                                    <span>{worker.center_ref}</span>
                                    <span>•</span>
                                    <span>{worker.nationality_code}</span>
                                    <span>•</span>
                                    <span>{worker.job1}</span>
                                  </div>
                                </div>
                                <Badge variant="outline" className="ml-2">
                                  {worker.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchWorkerQuery.length >= 2 && workers.length === 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
                          No available workers found. Try a different search term.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Service Details */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Services</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addService}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Service
                    </Button>
                  </div>
                  
                  {services.map((service, index) => (
                    <Card key={service.id} className="p-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <Label className="text-base">Service {index + 1}</Label>
                          {services.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeService(service.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Service Type *</Label>
                          <Select
                            value={service.service_type}
                            onValueChange={(value) => updateService(service.id, 'service_type', value)}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select service type" />
                            </SelectTrigger>
                            <SelectContent>
                              {salesPackages.map((pkg) => (
                                <SelectItem key={pkg.id} value={pkg.code}>
                                  {pkg.code} - {pkg.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* P4 Monthly Fields - shown conditionally */}
                        {/* P4 Monthly Fields - shown conditionally */}
                        {isP4Monthly(service.service_type) && (
                          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-4 border border-blue-200 dark:border-blue-800">
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">P4 Monthly Contract Details</p>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Number of Months *</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="24"
                                  value={service.p4_months || ""}
                                  onChange={(e) => updateService(service.id, 'p4_months', e.target.value)}
                                  placeholder="e.g., 12"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Monthly Rate (AED) *</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={service.p4_monthly_rate || ""}
                                  onChange={(e) => updateService(service.id, 'p4_monthly_rate', e.target.value)}
                                  placeholder="e.g., 1500"
                                />
                              </div>
                            </div>

                            {service.p4_months && service.p4_monthly_rate && (
                              <div className="p-2 bg-green-100 dark:bg-green-900 rounded text-sm text-center">
                                <span className="font-medium">
                                  {service.p4_months} months × AED {parseFloat(service.p4_monthly_rate || "0").toLocaleString()} = 
                                  <span className="text-green-700 dark:text-green-300 font-bold ml-1">
                                    AED {(parseInt(service.p4_months || "0") * parseFloat(service.p4_monthly_rate || "0")).toLocaleString()}
                                  </span>
                                </span>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Start Date *</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !service.p4_start_date && "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {service.p4_start_date ? format(service.p4_start_date, "PPP") : "Select start date"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={service.p4_start_date}
                                      onSelect={(date) => updateService(service.id, 'p4_start_date', date)}
                                      initialFocus
                                      className={cn("p-3 pointer-events-auto")}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>

                              <div className="space-y-2">
                                <Label>End Date (Auto-calculated)</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !service.p4_end_date && "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {service.p4_end_date ? format(service.p4_end_date, "PPP") : "Auto-calculated"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={service.p4_end_date}
                                      onSelect={(date) => updateService(service.id, 'p4_end_date', date)}
                                      initialFocus
                                      className={cn("p-3 pointer-events-auto")}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Service Description</Label>
                          <Textarea
                            rows={2}
                            value={service.service_description}
                            onChange={(e) => updateService(service.id, 'service_description', e.target.value)}
                            placeholder="Describe the service..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Amount (AED) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            required
                            value={service.amount}
                            onChange={(e) => updateService(service.id, 'amount', e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Deal Value Summary */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Deal Value Summary</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vat_rate">VAT Rate (%)</Label>
                    <Input
                      id="vat_rate"
                      type="number"
                      step="0.01"
                      value={formData.vat_rate}
                      onChange={(e) => setFormData({ ...formData, vat_rate: e.target.value })}
                      placeholder="5"
                    />
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal (Excl. VAT):</span>
                      <span className="font-medium">AED {calculatedAmounts.base_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">VAT ({formData.vat_rate}%):</span>
                      <span className="font-medium">AED {calculatedAmounts.vat_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total Deal Amount:</span>
                      <span>AED {calculatedAmounts.total_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="received_amount">Received Amount (AED)</Label>
                    <Input
                      id="received_amount"
                      type="number"
                      step="0.01"
                      value={formData.received_amount}
                      onChange={(e) => setFormData({ ...formData, received_amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  {parseFloat(formData.received_amount) > 0 && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-2">
                      <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
                        <span>Received:</span>
                        <span>AED {parseFloat(formData.received_amount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-orange-600 dark:text-orange-400 font-bold border-t pt-2">
                        <span>Balance Due:</span>
                        <span>AED {calculatedAmounts.balance_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

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

                  {parseFloat(formData.commission_rate) > 0 && (
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <span className="text-sm">Commission Amount: </span>
                      <span className="font-medium">AED {calculatedAmounts.commission_amount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Attachments */}
                <div className="space-y-2">
                  <Label htmlFor="attachments">Attachments</Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        id="attachments"
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="cursor-pointer"
                      />
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        {attachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted rounded-lg"
                          >
                            <span className="text-sm truncate flex-1">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                    onClick={() => navigate("/crm/contracts")}
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

export default CreateContract;
