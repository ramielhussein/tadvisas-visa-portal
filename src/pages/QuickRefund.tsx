import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSearchParams, useNavigate } from "react-router-dom";

const QuickRefund = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Pre-fill from URL params (coming from deal page)
  const [clientName, setClientName] = useState(searchParams.get("client_name") || "");
  const [clientPhone, setClientPhone] = useState(searchParams.get("client_phone") || "");
  const [refundAmount, setRefundAmount] = useState(searchParams.get("amount") || "");
  const [dealId, setDealId] = useState(searchParams.get("deal_id") || "");
  const [contractNo, setContractNo] = useState(searchParams.get("contract_no") || "");
  const [workerName, setWorkerName] = useState(searchParams.get("worker_name") || "");
  const [notes, setNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  // Fetch salespeople for attribution
  const { data: salespeople = [] } = useQuery({
    queryKey: ["salespeople"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");
      return data || [];
    },
  });

  // Fetch deals to link refund
  const { data: deals = [] } = useQuery({
    queryKey: ["active-deals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("deals")
        .select("id, deal_number, client_name, client_phone, worker_name, assigned_to, total_amount")
        .eq("status", "Active")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Fetch recent refunds
  const { data: recentRefunds = [], isLoading: refundsLoading } = useQuery({
    queryKey: ["recent-refunds"],
    queryFn: async () => {
      const { data } = await supabase
        .from("refunds")
        .select("id, contract_no, client_name, worker_name, total_refund_amount, status, created_at, prepared_by")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  // Submit refund mutation
  const submitRefund = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(refundAmount);
      if (!amount || amount <= 0) throw new Error("Please enter a valid refund amount");
      if (!clientName.trim()) throw new Error("Please enter the client name");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("refunds").insert({
        contract_no: contractNo || `REF-${Date.now()}`,
        client_name: clientName,
        client_mobile: clientPhone,
        worker_name: workerName || "N/A",
        nationality: "Other",
        emirate: "Dubai",
        location: "Inside Country",
        price_incl_vat: amount,
        total_refund_amount: amount,
        status: "finalized",
        prepared_by: assignedTo || user.id,
        deal_id: dealId || null,
        notes,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Refund recorded successfully");
      queryClient.invalidateQueries({ queryKey: ["recent-refunds"] });
      // Reset form
      setClientName("");
      setClientPhone("");
      setRefundAmount("");
      setDealId("");
      setContractNo("");
      setWorkerName("");
      setNotes("");
      setAssignedTo("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete refund
  const deleteRefund = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("refunds").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Refund deleted");
      queryClient.invalidateQueries({ queryKey: ["recent-refunds"] });
    },
    onError: () => {
      toast.error("Failed to delete refund");
    },
  });

  // Auto-fill from selected deal
  const handleDealSelect = (dealIdValue: string) => {
    setDealId(dealIdValue);
    const deal = deals.find(d => d.id === dealIdValue);
    if (deal) {
      setClientName(deal.client_name);
      setClientPhone(deal.client_phone);
      setContractNo(deal.deal_number);
      setWorkerName(deal.worker_name || "");
      if (deal.assigned_to) setAssignedTo(deal.assigned_to);
    }
  };

  const getSalespersonName = (id: string) => {
    const person = salespeople.find(p => p.id === id);
    return person?.full_name || person?.email || "Unknown";
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <RotateCcw className="w-8 h-8 text-rose-600" />
          <div>
            <h1 className="text-3xl font-bold">Quick Refund</h1>
            <p className="text-muted-foreground">Record a refund quickly - just enter the amount</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Refund Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Record Refund
              </CardTitle>
              <CardDescription>
                Enter the client name and refund amount
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Link to Deal (optional) */}
              <div className="space-y-2">
                <Label>Link to Deal (optional)</Label>
                <Select value={dealId} onValueChange={handleDealSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a deal to auto-fill..." />
                  </SelectTrigger>
                  <SelectContent>
                    {deals.map((deal) => (
                      <SelectItem key={deal.id} value={deal.id}>
                        {deal.deal_number} - {deal.client_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client Name *</Label>
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Enter client name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client Phone</Label>
                  <Input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contract/Reference #</Label>
                  <Input
                    value={contractNo}
                    onChange={(e) => setContractNo(e.target.value)}
                    placeholder="Contract number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Worker Name</Label>
                  <Input
                    value={workerName}
                    onChange={(e) => setWorkerName(e.target.value)}
                    placeholder="Worker name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Refund Amount (AED) *</Label>
                  <Input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-lg font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Salesperson</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select salesperson..." />
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
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes about this refund..."
                  rows={2}
                />
              </div>

              <Button
                onClick={() => submitRefund.mutate()}
                disabled={submitRefund.isPending || !clientName || !refundAmount}
                className="w-full"
                size="lg"
              >
                {submitRefund.isPending ? "Recording..." : "Record Refund"}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Refunds */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Refunds</CardTitle>
              <CardDescription>Last 20 refunds recorded</CardDescription>
            </CardHeader>
            <CardContent>
              {refundsLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : recentRefunds.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No refunds recorded yet</p>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentRefunds.map((refund) => (
                        <TableRow key={refund.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{refund.client_name}</p>
                              <p className="text-xs text-muted-foreground">{refund.contract_no}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-rose-600">
                            AED {refund.total_refund_amount?.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(refund.created_at), "dd/MM/yy")}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteRefund.mutate(refund.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default QuickRefund;
