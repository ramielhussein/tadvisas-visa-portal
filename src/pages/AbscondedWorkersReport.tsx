import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Search, AlertTriangle, DollarSign, Shield, Building2, FileWarning, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AbscondedRefund {
  id: string;
  created_at: string;
  contract_no: string;
  client_name: string;
  worker_name: string;
  nationality: string;
  total_refund_amount: number;
  price_incl_vat: number;
  status: string;
  abscond_date: string | null;
  abscond_classification: string | null;
  claim_status: string | null;
  claim_amount: number | null;
  claim_submitted_date: string | null;
  claim_paid_date: string | null;
  claim_reference: string | null;
  claim_notes: string | null;
  insurance_provider: string | null;
  agent_supplier_id: string | null;
  days_worked: number | null;
}

interface Supplier {
  id: string;
  supplier_name: string;
}

const AbscondedWorkersReport = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminCheckLoading } = useAdminCheck();
  const [searchQuery, setSearchQuery] = useState("");
  const [classificationFilter, setClassificationFilter] = useState<string>("all");
  const [claimStatusFilter, setClaimStatusFilter] = useState<string>("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<AbscondedRefund | null>(null);
  const [editFormData, setEditFormData] = useState({
    abscond_classification: "",
    claim_status: "pending",
    claim_amount: "",
    claim_reference: "",
    claim_notes: "",
    insurance_provider: "",
    agent_supplier_id: "",
  });

  // Fetch absconded refunds (where reason is Runaway or abscond_report is true)
  const { data: refunds = [], isLoading, refetch } = useQuery({
    queryKey: ['absconded-refunds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('refunds')
        .select('*')
        .or('reason.eq.Runaway,abscond_report.eq.true')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AbscondedRefund[];
    }
  });

  // Fetch suppliers for agent selection
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers-for-claims'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, supplier_name')
        .eq('status', 'Active')
        .order('supplier_name');

      if (error) throw error;
      return data as Supplier[];
    }
  });

  // Filter refunds
  const filteredRefunds = refunds.filter((refund) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        refund.contract_no.toLowerCase().includes(query) ||
        refund.client_name.toLowerCase().includes(query) ||
        refund.worker_name.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Classification filter
    if (classificationFilter !== "all") {
      if (classificationFilter === "unclassified" && refund.abscond_classification) return false;
      if (classificationFilter !== "unclassified" && refund.abscond_classification !== classificationFilter) return false;
    }

    // Claim status filter
    if (claimStatusFilter !== "all" && refund.claim_status !== claimStatusFilter) return false;

    return true;
  });

  // Calculate summary stats
  const stats = {
    total: refunds.length,
    nonInsured: refunds.filter(r => r.abscond_classification === 'NON_INSURED').length,
    insured: refunds.filter(r => r.abscond_classification === 'INSURED').length,
    agentCovered: refunds.filter(r => r.abscond_classification === 'AGENT_COVERED').length,
    unclassified: refunds.filter(r => !r.abscond_classification).length,
    totalLoss: refunds
      .filter(r => r.abscond_classification === 'NON_INSURED')
      .reduce((sum, r) => sum + Number(r.total_refund_amount || 0), 0),
    pendingClaims: refunds
      .filter(r => r.claim_status === 'submitted')
      .reduce((sum, r) => sum + Number(r.claim_amount || 0), 0),
    recoveredAmount: refunds
      .filter(r => r.claim_status === 'paid')
      .reduce((sum, r) => sum + Number(r.claim_amount || 0), 0),
  };

  const handleEditClick = (refund: AbscondedRefund) => {
    setSelectedRefund(refund);
    setEditFormData({
      abscond_classification: refund.abscond_classification || "",
      claim_status: refund.claim_status || "pending",
      claim_amount: refund.claim_amount?.toString() || "",
      claim_reference: refund.claim_reference || "",
      claim_notes: refund.claim_notes || "",
      insurance_provider: refund.insurance_provider || "",
      agent_supplier_id: refund.agent_supplier_id || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveClassification = async () => {
    if (!selectedRefund) return;

    try {
      const updateData: any = {
        abscond_classification: editFormData.abscond_classification || null,
        claim_status: editFormData.claim_status,
        claim_amount: editFormData.claim_amount ? parseFloat(editFormData.claim_amount) : null,
        claim_reference: editFormData.claim_reference || null,
        claim_notes: editFormData.claim_notes || null,
        insurance_provider: editFormData.insurance_provider || null,
        agent_supplier_id: editFormData.agent_supplier_id || null,
      };

      // Set claim_submitted_date if status changed to submitted
      if (editFormData.claim_status === 'submitted' && !selectedRefund.claim_submitted_date) {
        updateData.claim_submitted_date = new Date().toISOString().split('T')[0];
      }

      // Set claim_paid_date if status changed to paid
      if (editFormData.claim_status === 'paid' && !selectedRefund.claim_paid_date) {
        updateData.claim_paid_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('refunds')
        .update(updateData)
        .eq('id', selectedRefund.id);

      if (error) throw error;

      toast({ title: "Classification updated successfully" });
      setEditDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({ title: "Error updating classification", description: error.message, variant: "destructive" });
    }
  };

  const getClassificationBadge = (classification: string | null) => {
    switch (classification) {
      case 'NON_INSURED':
        return <Badge variant="destructive">Non-Insured</Badge>;
      case 'INSURED':
        return <Badge className="bg-blue-500">Insured</Badge>;
      case 'AGENT_COVERED':
        return <Badge className="bg-purple-500">Agent Covered</Badge>;
      default:
        return <Badge variant="outline">Unclassified</Badge>;
    }
  };

  const getClaimStatusBadge = (status: string | null) => {
    switch (status) {
      case 'submitted':
        return <Badge className="bg-yellow-500">Submitted</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'paid':
        return <Badge className="bg-emerald-600">Paid</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (adminCheckLoading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Access Denied</p>
              <p className="text-muted-foreground">You need admin access to view this page</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <FileWarning className="h-10 w-10 text-destructive" />
                Absconded Workers Report
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Track absconded workers, insurance claims, and agent recoveries
              </p>
            </div>
            <Button onClick={() => navigate('/refunds-list')}>
              View All Refunds
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  Company Loss (Non-Insured)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">AED {stats.totalLoss.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{stats.nonInsured} cases</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Insured Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{stats.insured}</p>
                <p className="text-xs text-muted-foreground">Insurance claimable</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-500" />
                  Agent Covered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-600">{stats.agentCovered}</p>
                <p className="text-xs text-muted-foreground">Agent/Supplier claims</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Recovered Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">AED {stats.recoveredAmount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Claims paid</p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Claims Alert */}
          {stats.pendingClaims > 0 && (
            <Card className="mb-6 bg-yellow-50 border-yellow-200">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">
                    Pending Claims: AED {stats.pendingClaims.toLocaleString()} awaiting response
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unclassified Alert */}
          {stats.unclassified > 0 && (
            <Card className="mb-6 bg-orange-50 border-orange-200">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-800">
                    {stats.unclassified} absconded worker(s) need classification
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by contract, client, or worker..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={classificationFilter} onValueChange={setClassificationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Classification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classifications</SelectItem>
                <SelectItem value="unclassified">Unclassified</SelectItem>
                <SelectItem value="NON_INSURED">Non-Insured</SelectItem>
                <SelectItem value="INSURED">Insured</SelectItem>
                <SelectItem value="AGENT_COVERED">Agent Covered</SelectItem>
              </SelectContent>
            </Select>
            <Select value={claimStatusFilter} onValueChange={setClaimStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Claim Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Absconded Workers ({filteredRefunds.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Contract</TableHead>
                      <TableHead>Worker</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Days Worked</TableHead>
                      <TableHead>Refund</TableHead>
                      <TableHead>Classification</TableHead>
                      <TableHead>Claim Status</TableHead>
                      <TableHead>Claim Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRefunds.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          No absconded workers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRefunds.map((refund) => (
                        <TableRow key={refund.id} className="hover:bg-muted/50">
                          <TableCell>
                            {refund.abscond_date 
                              ? format(new Date(refund.abscond_date), 'MMM dd, yyyy')
                              : format(new Date(refund.created_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="font-medium">{refund.contract_no}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{refund.worker_name}</div>
                              <div className="text-xs text-muted-foreground">{refund.nationality}</div>
                            </div>
                          </TableCell>
                          <TableCell>{refund.client_name}</TableCell>
                          <TableCell>{refund.days_worked || '-'}</TableCell>
                          <TableCell className="font-semibold">
                            AED {Number(refund.total_refund_amount).toLocaleString()}
                          </TableCell>
                          <TableCell>{getClassificationBadge(refund.abscond_classification)}</TableCell>
                          <TableCell>{getClaimStatusBadge(refund.claim_status)}</TableCell>
                          <TableCell>
                            {refund.claim_amount ? `AED ${Number(refund.claim_amount).toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(refund)}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Classification Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Abscond Classification</DialogTitle>
            <DialogDescription>
              Classify the abscond type and track claim status for {selectedRefund?.worker_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Classification</Label>
              <Select
                value={editFormData.abscond_classification}
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, abscond_classification: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select classification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NON_INSURED">Non-Insured (Company Loss)</SelectItem>
                  <SelectItem value="INSURED">Insured (Insurance Claim)</SelectItem>
                  <SelectItem value="AGENT_COVERED">Agent Covered (Supplier Claim)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editFormData.abscond_classification === 'INSURED' && (
              <div>
                <Label>Insurance Provider</Label>
                <Input
                  value={editFormData.insurance_provider}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, insurance_provider: e.target.value }))}
                  placeholder="e.g., Emirates Insurance"
                />
              </div>
            )}

            {editFormData.abscond_classification === 'AGENT_COVERED' && (
              <div>
                <Label>Agent/Supplier</Label>
                <Select
                  value={editFormData.agent_supplier_id}
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, agent_supplier_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.supplier_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(editFormData.abscond_classification === 'INSURED' || editFormData.abscond_classification === 'AGENT_COVERED') && (
              <>
                <div>
                  <Label>Claim Status</Label>
                  <Select
                    value={editFormData.claim_status}
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, claim_status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Claim Amount (AED)</Label>
                  <Input
                    type="number"
                    value={editFormData.claim_amount}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, claim_amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label>Claim Reference</Label>
                  <Input
                    value={editFormData.claim_reference}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, claim_reference: e.target.value }))}
                    placeholder="Claim number or reference"
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={editFormData.claim_notes}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, claim_notes: e.target.value }))}
                    placeholder="Additional notes about the claim..."
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveClassification}>
              Save Classification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AbscondedWorkersReport;
