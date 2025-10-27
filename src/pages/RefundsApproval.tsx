import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle, XCircle, AlertCircle, Clock, Edit } from "lucide-react";
import CompleteRefundDialog from "@/components/refunds/CompleteRefundDialog";
import { usePermissions } from "@/hooks/usePermissions";

interface Refund {
  id: string;
  contract_no: string;
  client_name: string;
  client_mobile: string;
  worker_name: string;
  nationality: string;
  emirate: string;
  location: string;
  total_refund_amount: number;
  price_incl_vat: number;
  base_price_ex_vat: number;
  vat_amount: number;
  status: string;
  reason: string;
  returned_date: string;
  delivered_date: string;
  days_worked: number;
  created_at: string;
  prepared_by: string;
  notes: string;
  rejection_reason: string;
  approved_at: string;
  approved_by: string;
}

export default function RefundsApproval() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
  const [rejectionReason, setRejectionReason] = useState("");
  const [userRole, setUserRole] = useState<string>("");
  const queryClient = useQueryClient();
  const { permissions, hasPermission } = usePermissions();

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (roles && roles.length > 0) {
        setUserRole(roles[0].role);
      }
    };
    checkRole();
  }, []);

  const { data: refunds, isLoading } = useQuery({
    queryKey: ["refunds-approval", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("refunds")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Refund[];
    },
  });

  const approveRefundMutation = useMutation({
    mutationFn: async ({ refundId, action }: { refundId: string; action: "approve" | "reject" }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const refund = refunds?.find(r => r.id === refundId);
      if (!refund) throw new Error("Refund not found");

      if (action === "approve") {
        // Step 1: Update refund status
        const { error: refundError } = await supabase
          .from("refunds")
          .update({
            status: "approved",
            approved_at: new Date().toISOString(),
            approved_by: user.id,
          })
          .eq("id", refundId);

        if (refundError) throw refundError;

        // Step 2: Get contract details to find worker
        const { data: contract, error: contractError } = await supabase
          .from("contracts")
          .select("worker_id")
          .eq("contract_number", refund.contract_no)
          .single();

        if (contractError) throw contractError;

        // Step 3: Create client as supplier if not exists
        const supplierName = `${refund.client_name} (Refund Client)`;
        const { data: existingSupplier } = await supabase
          .from("suppliers")
          .select("id")
          .eq("supplier_name", supplierName)
          .single();

        let supplierId = existingSupplier?.id;

        if (!supplierId) {
          const { data: newSupplier, error: supplierError } = await supabase
            .from("suppliers")
            .insert({
              supplier_name: supplierName,
              contact_person: refund.client_name,
              phone: refund.client_mobile || "",
              telephone: refund.client_mobile || "",
              supplier_type: "Refund - Worker Buyback",
              status: "Active",
              notes: `Auto-created from refund ${refund.contract_no}`,
            })
            .select()
            .single();

          if (supplierError) throw supplierError;
          supplierId = newSupplier.id;
        }

        // Step 4: Generate supplier invoice number
        const { data: invoiceNumber, error: invoiceNumError } = await supabase
          .rpc("generate_supplier_invoice_number");

        if (invoiceNumError) throw invoiceNumError;

        // Step 5: Create supplier invoice (Purchase Order from client)
        const { data: supplierInvoice, error: invoiceError } = await supabase
          .from("supplier_invoices")
          .insert({
            invoice_number: invoiceNumber,
            supplier_id: supplierId,
            supplier_name: supplierName,
            invoice_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            description: `Worker Buyback - ${refund.worker_name} (${refund.nationality}) - Contract ${refund.contract_no}`,
            subtotal: refund.total_refund_amount / 1.05,
            vat_rate: 5,
            vat_amount: refund.total_refund_amount - (refund.total_refund_amount / 1.05),
            total_amount: refund.total_refund_amount,
            balance_due: refund.total_refund_amount,
            status: "Pending",
            notes: `Auto-generated from approved refund. New COGS for worker: ${refund.total_refund_amount} AED`,
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        // Step 6: Link supplier invoice back to refund
        await supabase
          .from("refunds")
          .update({ supplier_invoice_id: supplierInvoice.id })
          .eq("id", refundId);

        // Step 7: Update worker COGS in financials
        if (contract?.worker_id) {
          const { data: worker, error: workerFetchError } = await supabase
            .from("workers")
            .select("financials")
            .eq("id", contract.worker_id)
            .single();

          if (!workerFetchError && worker) {
            const financials = worker.financials as any || {};
            const costs = financials.costs || [];
            
            // Add new COGS entry
            costs.push({
              label: `Buyback - ${refund.contract_no}`,
              amount: refund.total_refund_amount,
              date: new Date().toISOString(),
            });

            await supabase
              .from("workers")
              .update({ 
                financials: { ...financials, costs },
                status: "Available" // Worker is available again
              })
              .eq("id", contract.worker_id);
          }
        }

        return { action: "approved", invoiceNumber };
      } else {
        // Reject refund
        const { error } = await supabase
          .from("refunds")
          .update({
            status: "rejected",
            rejection_reason: rejectionReason,
            approved_by: user.id,
            approved_at: new Date().toISOString(),
          })
          .eq("id", refundId);

        if (error) throw error;
        return { action: "rejected" };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["refunds-approval"] });
      setShowApprovalDialog(false);
      setSelectedRefund(null);
      setRejectionReason("");
      
      if (data.action === "approved") {
        toast.success(`Refund approved! Supplier Invoice ${data.invoiceNumber} created. Worker COGS updated.`);
      } else {
        toast.success("Refund rejected");
      }
    },
    onError: (error: any) => {
      toast.error("Failed to process refund", {
        description: error.message,
      });
    },
  });

  const handleApprovalAction = (refund: Refund, action: "approve" | "reject") => {
    setSelectedRefund(refund);
    setApprovalAction(action);
    setShowApprovalDialog(true);
  };

  const confirmApproval = () => {
    if (!selectedRefund) return;
    if (approvalAction === "reject" && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    approveRefundMutation.mutate({
      refundId: selectedRefund.id,
      action: approvalAction,
    });
  };

  const handleCompleteRefund = (refund: Refund) => {
    setSelectedRefund(refund);
    setShowCompleteDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800"><Edit className="w-3 h-3 mr-1" />Draft</Badge>;
      case "pending_approval":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "finalized":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Finalized</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const hasFinancePermission = hasPermission("finance", "manage_invoices");
  const canEditDraft = userRole === "admin" || !hasFinancePermission;
  const canApprove = userRole === "admin" || hasFinancePermission;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p>Loading refunds...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Refunds Management</CardTitle>
                <CardDescription>Manage refund requests from cancelled contracts</CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Refunds</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="finalized">Finalized</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {!refunds || refunds.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No refunds found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Worker</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Days Worked</TableHead>
                    <TableHead className="text-right">Refund Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refunds.map((refund) => (
                    <TableRow key={refund.id}>
                      <TableCell className="font-medium">{refund.contract_no}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{refund.client_name}</div>
                          <div className="text-sm text-muted-foreground">{refund.client_mobile}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{refund.worker_name}</div>
                          <div className="text-sm text-muted-foreground">{refund.nationality}</div>
                        </div>
                      </TableCell>
                      <TableCell>{refund.reason || "N/A"}</TableCell>
                      <TableCell>{refund.days_worked || 0} days</TableCell>
                      <TableCell className="text-right font-medium">
                        {refund.total_refund_amount?.toLocaleString()} AED
                      </TableCell>
                      <TableCell>{getStatusBadge(refund.status)}</TableCell>
                      <TableCell>{format(new Date(refund.created_at), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        {refund.status === "draft" && canEditDraft && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCompleteRefund(refund)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Complete Refund
                          </Button>
                        )}
                        {refund.status === "pending_approval" && canApprove && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-green-50 hover:bg-green-100 text-green-700"
                              onClick={() => handleApprovalAction(refund, "approve")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-red-50 hover:bg-red-100 text-red-700"
                              onClick={() => handleApprovalAction(refund, "reject")}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        {refund.status === "rejected" && refund.rejection_reason && (
                          <p className="text-sm text-red-600">{refund.rejection_reason}</p>
                        )}
                        {refund.status === "approved" && (
                          <p className="text-sm text-green-600">Invoice created</p>
                        )}
                        {refund.status === "draft" && !canEditDraft && (
                          <p className="text-sm text-muted-foreground">Awaiting completion</p>
                        )}
                        {refund.status === "pending_approval" && !canApprove && (
                          <p className="text-sm text-muted-foreground">Awaiting approval</p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approve" ? "Approve Refund" : "Reject Refund"}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === "approve" 
                ? `This will create a supplier invoice for ${selectedRefund?.total_refund_amount.toLocaleString()} AED and update the worker's COGS. The client becomes a supplier.`
                : "Please provide a reason for rejecting this refund request."}
            </DialogDescription>
          </DialogHeader>

          {selectedRefund && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Contract:</p>
                  <p className="text-muted-foreground">{selectedRefund.contract_no}</p>
                </div>
                <div>
                  <p className="font-medium">Client:</p>
                  <p className="text-muted-foreground">{selectedRefund.client_name}</p>
                </div>
                <div>
                  <p className="font-medium">Worker:</p>
                  <p className="text-muted-foreground">{selectedRefund.worker_name}</p>
                </div>
                <div>
                  <p className="font-medium">Refund Amount:</p>
                  <p className="text-muted-foreground font-semibold">{selectedRefund.total_refund_amount.toLocaleString()} AED</p>
                </div>
              </div>

              {approvalAction === "reject" && (
                <div>
                  <label className="text-sm font-medium">Rejection Reason</label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this refund is being rejected..."
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmApproval}
              disabled={approveRefundMutation.isPending}
              className={approvalAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {approveRefundMutation.isPending 
                ? "Processing..." 
                : approvalAction === "approve" 
                  ? "Confirm Approval" 
                  : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CompleteRefundDialog
        refund={selectedRefund}
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["refunds-approval"] });
          setSelectedRefund(null);
        }}
      />
    </Layout>
  );
}