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
    name: string;
    url: string;
    uploaded_at: string;
    uploaded_by: string;
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
        navigate("/deals");
        return;
      }

      setDeal(data as unknown as Deal);

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
      navigate("/deals");
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
                onClick={() => navigate("/deals")}
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
              {deal.attachments && deal.attachments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Paperclip className="w-5 h-5" />
                      Attachments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {deal.attachments.map((attachment, index) => (
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
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Deal Value</span>
                    <span className="font-medium">AED {Number(deal.deal_value).toLocaleString()}</span>
                  </div>
                  {deal.vat_rate && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">VAT ({deal.vat_rate}%)</span>
                        <span className="font-medium">AED {Number(deal.vat_amount || 0).toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Amount</span>
                    <span className="font-bold text-lg">AED {Number(deal.total_amount).toLocaleString()}</span>
                  </div>
                  {deal.commission_rate && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Commission ({deal.commission_rate}%)</span>
                        <span className="font-medium">AED {Number(deal.commission_amount || 0).toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Deal Owner/Creator */}
              {assignedUser && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Deal Owner
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Assigned To</p>
                      <p className="font-medium">{assignedUser.full_name || assignedUser.email || "Unknown"}</p>
                      {assignedUser.email && assignedUser.full_name && (
                        <p className="text-xs text-muted-foreground mt-1">{assignedUser.email}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Created</p>
                    <p className="text-sm font-medium">
                      {new Date(deal.created_at).toLocaleString('en-GB')}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                    <p className="text-sm font-medium">
                      {new Date(deal.updated_at).toLocaleString('en-GB')}
                    </p>
                  </div>
                  {deal.closed_at && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Closed</p>
                        <p className="text-sm font-medium">
                          {new Date(deal.closed_at).toLocaleString('en-GB')}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DealDetail;
