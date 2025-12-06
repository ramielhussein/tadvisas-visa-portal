import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import RecordDealPaymentDialog from "@/components/deals/RecordDealPaymentDialog";
import VoidContractDialog from "@/components/deals/VoidContractDialog";
import DealCostsSection from "@/components/deals/DealCostsSection";
import { ArrowLeft, User, Phone, Mail, Calendar, DollarSign, FileText, Briefcase, Paperclip, Download, CreditCard, Printer, Send } from "lucide-react";
import { format } from "date-fns";
import html2pdf from "html2pdf.js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Deal {
  id: string;
  deal_number: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  service_type: string;
  service_description: string | null;
  deal_value: number;
  vat_rate: number | null;
  vat_amount: number | null;
  total_amount: number;
  status: string;
  payment_terms: string | null;
  worker_name: string | null;
  worker_id: string | null;
  commission_rate: number | null;
  commission_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  assigned_to: string | null;
  paid_amount: number;
  balance_due: number;
  start_date: string | null;
  end_date: string | null;
  reminder_days_before: number | null;
  attachments: Array<{
    name?: string;
    url?: string; // legacy public url
    path?: string; // storage path for private bucket
    uploaded_at?: string;
    uploaded_by?: string;
  }> | null;
}

interface Payment {
  id: string;
  payment_number: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  reference_number: string | null;
  bank_account_id: string | null;
  notes: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [assignedUser, setAssignedUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedAttachments, setSignedAttachments] = useState<{ name: string; url: string }[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [voidLoading, setVoidLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [canApproveDeal, setCanApproveDeal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDeal();
      fetchBankAccounts();
      checkApprovalPermission();
    }
  }, [id]);

  const checkApprovalPermission = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['sales_manager', 'admin', 'super_admin']);

    setCanApproveDeal(roles && roles.length > 0);
  };

  const fetchBankAccounts = async () => {
    const { data } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("status", "Active");
    
    setBankAccounts(data || []);
  };

  const fetchPayments = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("deal_id", id)
      .order("payment_date", { ascending: false });

    if (!error && data) {
      setPayments(data as Payment[]);
    }
  };

  const fetchDeal = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Contract not found",
          description: "The contract you're looking for doesn't exist.",
          variant: "destructive",
        });
        navigate("/crm/contracts");
        return;
      }

      setDeal(data as unknown as Deal);

      // Fetch payments for this deal
      fetchPayments();

      // Prepare signed URLs for attachments
      const atts = (data.attachments || []) as any[];
      const signed: { name: string; url: string }[] = [];
      for (const att of atts) {
        let path: string | undefined = att?.path;
        if (!path && att?.url) {
          const marker = "/storage/v1/object/public/crm-documents/";
          const idx = (att.url as string).indexOf(marker);
          if (idx !== -1) path = (att.url as string).substring(idx + marker.length);
        }
        if (path) {
          const { data: signedData } = await supabase.storage
            .from("crm-documents")
            .createSignedUrl(path, 3600);
          if (signedData?.signedUrl) {
            signed.push({ name: att.name || path.split("/").pop() || "Attachment", url: signedData.signedUrl });
            continue;
          }
        }
        if (att?.url) {
          signed.push({ name: att.name || "Attachment", url: att.url });
        }
      }
      setSignedAttachments(signed);

      // Fetch assigned user details if assigned_to exists
      if (data.assigned_to) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("id", data.assigned_to)
          .maybeSingle();

        if (profileData) {
          setAssignedUser(profileData);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/crm/contracts");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Draft: "bg-gray-500",
      Active: "bg-blue-500",
      Closed: "bg-green-500",
      Cancelled: "bg-red-500",
      Void: "bg-orange-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const generateDealSheetHTML = () => {
    if (!deal) return '';
    
    let servicesHtml = '';
    try {
      const services = JSON.parse(deal.service_description || '[]');
      servicesHtml = services.map((service: any, index: number) => `
        <tr style="background-color: ${index % 2 === 0 ? '#fff' : '#f9f9f9'};">
          <td style="padding: 5px; border: 1px solid #ddd;">${index + 1}</td>
          <td style="padding: 5px; border: 1px solid #ddd;"><strong>${service.service_type || deal.service_type}</strong></td>
          <td style="padding: 5px; border: 1px solid #ddd;">${service.service_description || '-'}</td>
          <td style="padding: 5px; text-align: right; border: 1px solid #ddd;">${parseFloat(service.amount || 0).toFixed(2)}</td>
        </tr>
      `).join('');
    } catch {
      servicesHtml = `
        <tr>
          <td style="padding: 5px; border: 1px solid #ddd;">1</td>
          <td style="padding: 5px; border: 1px solid #ddd;"><strong>${deal.service_type}</strong></td>
          <td style="padding: 5px; border: 1px solid #ddd;">${deal.service_description || '-'}</td>
          <td style="padding: 5px; text-align: right; border: 1px solid #ddd;">${deal.total_amount.toFixed(2)}</td>
        </tr>
      `;
    }

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
              ${servicesHtml}
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
                      <td style="padding: 3px;"><strong>VAT (${deal.vat_rate || 5}%):</strong></td>
                      <td style="padding: 3px; text-align: right;">AED ${(deal.vat_amount || 0).toFixed(2)}</td>
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
                  <p style="margin: 0 0 5px;"><strong>Payment Terms:</strong> ${deal.payment_terms || 'Full Payment'}</p>
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

  const handleDownloadPDF = async () => {
    if (!deal) return;
    
    const dealSheetHTML = generateDealSheetHTML();
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

  const handlePrint = () => {
    if (!deal) return;
    
    const dealSheetHTML = generateDealSheetHTML();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Deal Sheet - ${deal.deal_number}</title>
            <style>
              @media print {
                body { margin: 0; padding: 0; }
              }
            </style>
          </head>
          <body>
            ${dealSheetHTML}
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() { window.close(); };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const [sendingEmail, setSendingEmail] = useState(false);

  const handleEmailDealSheet = async () => {
    if (!deal) return;
    
    if (!deal.client_email) {
      toast({
        title: "No email address",
        description: "This client doesn't have an email address on file.",
        variant: "destructive",
      });
      return;
    }

    setSendingEmail(true);
    
    try {
      const dealSheetHtml = generateDealSheetHTML();
      
      const { data, error } = await supabase.functions.invoke('send-contract-email', {
        body: {
          to: deal.client_email,
          clientName: deal.client_name,
          dealNumber: deal.deal_number,
          totalAmount: deal.total_amount,
          dealSheetHtml: dealSheetHtml,
        },
      });

      if (error) throw error;

      toast({
        title: "Email sent!",
        description: `Deal sheet sent to ${deal.client_email}`,
      });
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = { 
        status: newStatus,
        ...(newStatus === 'Closed' ? { closed_at: new Date().toISOString() } : {}),
        // Track approval when activating a draft deal
        ...(newStatus === 'Active' && user ? { 
          approved_by: user.id, 
          approved_at: new Date().toISOString() 
        } : {})
      };

      const { error } = await supabase
        .from("deals")
        .update(updateData)
        .eq("id", deal?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Deal status updated to ${newStatus}`,
      });

      // Send notification email when deal is activated
      if (newStatus === 'Active' && deal?.id) {
        try {
          await supabase.functions.invoke('send-deal-notification', {
            body: { type: 'deal_activated', deal_id: deal.id }
          });
          console.log('Deal activation notification sent');
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
          // Don't fail the status change if notification fails
        }
      }
      
      fetchDeal(); // Refresh deal data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleVoidDeal = async (workerStatus: string | null) => {
    setVoidLoading(true);
    try {
      // Update deal status to Void
      const { error: dealError } = await supabase
        .from("deals")
        .update({ status: "Void" })
        .eq("id", deal?.id);

      if (dealError) throw dealError;

      // Update worker status if a new status was selected and worker exists
      if (workerStatus && deal?.worker_id) {
        const { error: workerError } = await supabase
          .from("workers")
          .update({ status: workerStatus })
          .eq("id", deal.worker_id);

        if (workerError) {
          console.error("Failed to update worker status:", workerError);
        }
      }

      toast({
        title: "Success",
        description: `Contract has been voided${workerStatus ? ` and worker status set to "${workerStatus}"` : ""}`,
      });
      
      setVoidDialogOpen(false);
      fetchDeal();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setVoidLoading(false);
    }
  };

  const renderActionButtons = () => {
    if (!deal) return null;

    switch (deal.status) {
      case "Draft":
        return (
          <>
            <Button 
              variant="outline"
              onClick={() => navigate(`/crm/contracts/edit/${deal.id}`)}
            >
              Edit
            </Button>
            {canApproveDeal ? (
              <Button
                onClick={() => handleStatusChange("Active")}
              >
                Activate Contract
              </Button>
            ) : (
              <Button disabled variant="secondary" title="Only Sales Managers can activate contracts">
                Awaiting Manager Approval
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => setVoidDialogOpen(true)}
            >
              Void
            </Button>
          </>
        );
      
      case "Active":
        return (
          <>
            <Button
              variant="outline"
              onClick={() => navigate(`/crm/contracts/edit/${deal.id}`)}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setVoidDialogOpen(true)}
            >
              Void
            </Button>
          </>
        );
      
      case "Closed":
      case "Void":
        return (
          <Button
            variant="outline"
            onClick={() => navigate("/crm/contracts")}
          >
            Back to Contracts
          </Button>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading deal details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!deal) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/crm/contracts")}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{deal.deal_number}</h1>
                <p className="text-muted-foreground">Contract Details</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getStatusColor(deal.status)}>
                {deal.status}
              </Badge>
              
              {/* Deal Sheet Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Deal Sheet
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDownloadPDF}>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Dedicated Email Client Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleEmailDealSheet}
                disabled={sendingEmail}
                className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
              >
                {sendingEmail ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                {sendingEmail ? "Sending..." : "Email Client"}
              </Button>
              
              {renderActionButtons()}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Name</p>
                      <p className="font-medium">{deal.client_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Phone
                      </p>
                      <p className="font-mono text-sm">{deal.client_phone}</p>
                    </div>
                    {deal.client_email && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          Email
                        </p>
                        <p className="text-sm">{deal.client_email}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Service Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Service Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    // Try to parse service_description as JSON array
                    let services: any[] = [];
                    try {
                      if (deal.service_description) {
                        services = JSON.parse(deal.service_description);
                      }
                    } catch {
                      // Not JSON, will display as plain text
                    }

                    if (services.length > 0) {
                      return (
                        <div className="space-y-4">
                          {services.map((service, index) => (
                            <div key={service.id || index} className="p-4 bg-muted/50 rounded-lg border">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-semibold text-primary">{service.service_type}</span>
                                <span className="font-medium">AED {parseFloat(service.amount || 0).toLocaleString()}</span>
                              </div>
                              {service.service_description && (
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-2">
                                  {service.service_description}
                                </p>
                              )}
                              {service.p4_months && (
                                <div className="mt-2 pt-2 border-t text-sm space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Duration:</span>
                                    <span>{service.p4_months} months</span>
                                  </div>
                                  {service.p4_monthly_rate && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Monthly Rate:</span>
                                      <span>AED {parseFloat(service.p4_monthly_rate).toLocaleString()}</span>
                                    </div>
                                  )}
                                  {service.p4_start_date && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Start:</span>
                                      <span>{format(new Date(service.p4_start_date), "dd MMM yyyy")}</span>
                                    </div>
                                  )}
                                  {service.p4_end_date && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">End:</span>
                                      <span>{format(new Date(service.p4_end_date), "dd MMM yyyy")}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    }

                    // Fallback to plain display
                    return (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Service Type</p>
                          <p className="font-medium">{deal.service_type}</p>
                        </div>
                        {deal.service_description && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Description</p>
                            <p className="text-sm whitespace-pre-wrap">{deal.service_description}</p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  {deal.worker_name && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Assigned Worker</p>
                      <p className="font-medium">{deal.worker_name}</p>
                    </div>
                  )}
                  {deal.payment_terms && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Payment Terms</p>
                      <p className="text-sm">{deal.payment_terms}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Attachments */}
              {signedAttachments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Paperclip className="w-5 h-5" />
                      Attachments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {signedAttachments.map((attachment, index) => (
                        <a
                          key={index}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">{attachment.name}</span>
                          </div>
                          <Download className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {deal.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{deal.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Financial Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Deal Value</p>
                      <p className="font-medium">AED {deal.deal_value.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">VAT ({deal.vat_rate || 0}%)</p>
                      <p className="font-medium">AED {(deal.vat_amount || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                      <p className="font-medium">AED {deal.total_amount.toFixed(2)}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Commission Rate</p>
                      <p className="font-medium">{deal.commission_rate || 0}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Commission Amount</p>
                      <p className="font-medium">AED {(deal.commission_amount || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Tracking */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Amount</span>
                      <span className="font-semibold">{deal.total_amount.toLocaleString()} AED</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Paid Amount</span>
                      <span className="font-semibold text-green-600">{deal.paid_amount.toLocaleString()} AED</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Balance Due</span>
                      <span className="font-bold text-lg text-orange-600">{deal.balance_due.toLocaleString()} AED</span>
                    </div>
                  </div>
                  
                  {deal.status !== 'Void' && deal.status !== 'Closed' && deal.balance_due > 0 && (
                    <Button 
                      className="w-full" 
                      variant="default"
                      onClick={() => setPaymentDialogOpen(true)}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Record Payment
                    </Button>
                  )}

                  {/* Payment History */}
                  {payments.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium mb-3">Payment History</p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {payments.map((payment) => {
                            const bankAccount = bankAccounts.find(b => b.id === payment.bank_account_id);
                            return (
                              <div key={payment.id} className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                                <div className="flex justify-between items-start">
                                  <span className="font-medium">{payment.payment_number}</span>
                                  <span className="font-semibold text-green-600">{payment.amount.toLocaleString()} AED</span>
                                </div>
                                <div className="text-xs text-muted-foreground space-y-0.5">
                                  <div>Date: {new Date(payment.payment_date).toLocaleDateString()}</div>
                                  {bankAccount && (
                                    <div>Bank: {bankAccount.bank_name} - {bankAccount.account_name}</div>
                                  )}
                                  {payment.payment_method && (
                                    <div>Method: {payment.payment_method}</div>
                                  )}
                                  {payment.reference_number && (
                                    <div>Ref: {payment.reference_number}</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Cost of Goods & Profit */}
              <DealCostsSection 
                dealId={deal.id} 
                totalRevenue={deal.total_amount}
                workerId={deal.worker_id}
              />

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Created</span>
                    <span>{new Date(deal.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated</span>
                    <span>{new Date(deal.updated_at).toLocaleString()}</span>
                  </div>
                  {deal.closed_at && (
                    <div className="flex justify-between">
                      <span>Closed</span>
                      <span>{new Date(deal.closed_at).toLocaleString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assigned To */}
              {assignedUser && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Assigned To
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <p className="font-medium">{assignedUser.full_name || assignedUser.email}</p>
                      <p className="text-sm text-muted-foreground">{assignedUser.email}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <RecordDealPaymentDialog
        open={paymentDialogOpen}
        deal={deal}
        onClose={() => setPaymentDialogOpen(false)}
        onSuccess={() => {
          fetchDeal();
          fetchPayments();
        }}
      />

      <VoidContractDialog
        open={voidDialogOpen}
        onOpenChange={setVoidDialogOpen}
        workerName={deal?.worker_name || null}
        onConfirm={handleVoidDeal}
        isLoading={voidLoading}
      />
    </Layout>
  );
};

export default ContractDetail;
