import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, ArrowRightLeft, Wallet } from "lucide-react";
import { format } from "date-fns";

interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string;
  current_balance: number;
  currency: string;
}

interface Transfer {
  id: string;
  transaction_number: string;
  transaction_date: string;
  amount: number;
  debit_account: string;
  credit_account: string;
  notes?: string;
}

const BankTransfers = () => {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    amount: 0,
    from_bank_id: "",
    to_bank_id: "",
    notes: "",
  });

  // Fetch bank accounts
  const { data: bankAccounts } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("status", "Active")
        .order("account_name");
      
      if (error) throw error;
      return data as BankAccount[];
    },
  });

  // Fetch recent transfers
  const { data: transfers, isLoading } = useQuery({
    queryKey: ["bank-transfers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("transaction_type", "Bank Transfer")
        .order("transaction_date", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as Transfer[];
    },
  });

  const createTransferMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("User not authenticated");

      const fromAccount = bankAccounts?.find(b => b.id === data.from_bank_id);
      const toAccount = bankAccounts?.find(b => b.id === data.to_bank_id);

      if (!fromAccount || !toAccount) throw new Error("Invalid bank accounts");
      if (data.from_bank_id === data.to_bank_id) throw new Error("Cannot transfer to the same account");
      if (data.amount <= 0) throw new Error("Amount must be greater than 0");
      if ((fromAccount.current_balance || 0) < data.amount) {
        throw new Error("Insufficient balance in source account");
      }

      // Generate transaction number
      const { data: txNumber, error: txNumError } = await supabase.rpc('generate_transaction_number');
      if (txNumError) throw txNumError;
      
      // Create transfer transaction
      const { error: insertError } = await supabase.from("transactions").insert([{
        transaction_number: txNumber,
        transaction_type: "Bank Transfer",
        transaction_date: data.transaction_date,
        amount: data.amount,
        account_type: "Transfer",
        debit_account: toAccount.account_name,
        credit_account: fromAccount.account_name,
        notes: data.notes || null,
        status: "Completed",
        created_by: user.id,
      }]);

      if (insertError) throw insertError;

      // Update source account (deduct)
      const newFromBalance = (fromAccount.current_balance || 0) - data.amount;
      const { error: fromError } = await supabase
        .from("bank_accounts")
        .update({ current_balance: newFromBalance })
        .eq("id", data.from_bank_id);
      
      if (fromError) throw fromError;

      // Update destination account (add)
      const newToBalance = (toAccount.current_balance || 0) + data.amount;
      const { error: toError } = await supabase
        .from("bank_accounts")
        .update({ current_balance: newToBalance })
        .eq("id", data.to_bank_id);
      
      if (toError) throw toError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      setShowDialog(false);
      resetForm();
      toast.success("Transfer completed successfully");
    },
    onError: (error: Error) => {
      toast.error("Transfer failed", {
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setFormData({
      transaction_date: new Date().toISOString().split('T')[0],
      amount: 0,
      from_bank_id: "",
      to_bank_id: "",
      notes: "",
    });
  };

  // Calculate total balance across all accounts
  const totalBalance = bankAccounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Bank Transfers</h1>
            <p className="text-muted-foreground">Transfer funds between bank accounts</p>
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Transfer
          </Button>
        </div>

        {/* Bank Accounts Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-primary text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <Wallet className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBalance.toFixed(2)} AED</div>
            </CardContent>
          </Card>

          {bankAccounts?.slice(0, 3).map((account) => (
            <Card key={account.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{account.account_name}</CardTitle>
                <p className="text-xs text-muted-foreground">{account.bank_name}</p>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{(account.current_balance || 0).toFixed(2)} {account.currency}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Transfers */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading transfers...</p>
            ) : transfers && transfers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction #</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell>{format(new Date(transfer.transaction_date), "dd MMM yyyy")}</TableCell>
                      <TableCell className="font-mono text-sm">{transfer.transaction_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{transfer.credit_account}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{transfer.debit_account}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {transfer.amount.toFixed(2)} AED
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {transfer.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No transfers recorded yet</p>
            )}
          </CardContent>
        </Card>

        {/* New Transfer Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Bank Transfer</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transaction_date">Transfer Date</Label>
                <Input
                  id="transaction_date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="from_bank_id">From Account *</Label>
                <Select value={formData.from_bank_id} onValueChange={(value) => setFormData({ ...formData, from_bank_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts?.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name} - {account.bank_name} ({account.current_balance?.toFixed(2)} {account.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-center py-2">
                <ArrowRightLeft className="h-6 w-6 text-primary" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="to_bank_id">To Account *</Label>
                <Select value={formData.to_bank_id} onValueChange={(value) => setFormData({ ...formData, to_bank_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts?.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name} - {account.bank_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (AED) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount || ""}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add notes about this transfer..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>
                Cancel
              </Button>
              <Button 
                onClick={() => createTransferMutation.mutate(formData)}
                disabled={
                  formData.amount <= 0 || 
                  !formData.from_bank_id || 
                  !formData.to_bank_id || 
                  formData.from_bank_id === formData.to_bank_id ||
                  createTransferMutation.isPending
                }
              >
                {createTransferMutation.isPending ? "Processing..." : "Complete Transfer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default BankTransfers;
