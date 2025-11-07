import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { ArrowLeft, User, Phone, Mail, Calendar, DollarSign, FileText, Briefcase, Paperclip, Download } from "lucide-react";

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
  attachments: Array<{
    name?: string;
    url?: string; // legacy public url
    path?: string; // storage path for private bucket
    uploaded_at?: string;
    uploaded_by?: string;
  }> | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

const DealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [assignedUser, setAssignedUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedAttachments, setSignedAttachments] = useState<{ name: string; url: string }[]>([]);

  useEffect(() => {
    if (id) {
      fetchDeal();
    }
  }, [id]);

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
          title: "Deal not found",
          description: "The deal you're looking for doesn't exist.",
          variant: "destructive",
        });
        navigate("/crm/deals");
        return;
      }

      setDeal(data as unknown as Deal);

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
      navigate("/crm/deals");
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
    };
    return colors[status] || "bg-gray-500";
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
                onClick={() => navigate("/crm/deals")}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{deal.deal_number}</h1>
                <p className="text-muted-foreground">Deal Details</p>
              </div>
            </div>
            <Badge className={getStatusColor(deal.status)}>
              {deal.status}
            </Badge>
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
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Service Type</p>
                    <p className="font-medium">{deal.service_type}</p>
                  </div>
                  {deal.service_description && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{deal.service_description}</p>
                    </div>
                  )}
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
    </Layout>
  );
};

export default DealDetail;
