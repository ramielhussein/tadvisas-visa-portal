import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { format } from "date-fns";

export default function OwnerEquity() {
  const [showDialog, setShowDialog] = useState(false);
  const [transactionType, setTransactionType] = useState<"Capital Contribution" | "Owner Drawing">("Capital Contribution");
  const [formData, setFormData] = useState({
    amount: 0,
    notes: "",
    transaction_date: new Date().toISOString().split('T')[0],
    bank_account_id: "",
  });
  const queryClient = useQueryClient();

  const { data: equityAccounts } = useQuery({
    queryKey: ["equity-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equity_accounts" as any)
        .select("*")
        .order("account_name");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: bankAccounts } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("status", "Active");
      if (error) throw error;
      return data;
    },
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ["equity-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          bank_accounts (account_name),
          equity_accounts (account_name, account_type)
        `)
        .in("transaction_type", ["Capital Contribution", "Owner Drawing"])
        .order("transaction_date", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: typeof formData & { type: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Find the appropriate equity account
      const equityAccount = equityAccounts?.find(
        acc => acc.account_type === (data.type === "Capital Contribution" ? "capital" : "drawings")
      );

      if (!equityAccount) throw new Error("Equity account not found");

      // Create transaction
      const { error: txError } = await supabase.from("transactions").insert([{
        transaction_number: `TXN-${Date.now()}`,
        transaction_type: data.type as any,
        transaction_date: data.transaction_date,
        amount: data.amount,
        bank_account_id: data.bank_account_id || null,
        equity_account_id: equityAccount.id,
        notes: data.notes,
        status: "Completed",
        account_type: "Equity",
        affects_pl: false,
        created_by: user.id,
      }]);

      if (txError) throw txError;

      // Update bank balance manually
      if (data.bank_account_id) {
        const changeAmount = data.type === "Capital Contribution" ? data.amount : -data.amount;
        const { data: bankData, error: bankFetchError } = await supabase
          .from("bank_accounts")
          .select("current_balance")
          .eq("id", data.bank_account_id)
          .single();
        
        if (!bankFetchError && bankData) {
          const { error: bankUpdateError } = await supabase
            .from("bank_accounts")
            .update({ current_balance: bankData.current_balance + changeAmount })
            .eq("id", data.bank_account_id);
          
          if (bankUpdateError) console.error("Bank balance update failed:", bankUpdateError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equity-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["equity-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      setShowDialog(false);
      resetForm();
      toast.success("Transaction recorded successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to record transaction", {
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setFormData({
      amount: 0,
      notes: "",
      transaction_date: new Date().toISOString().split('T')[0],
      bank_account_id: "",
    });
  };

  const capital = equityAccounts?.find(acc => acc.account_type === "capital")?.balance || 0;
  const drawings = equityAccounts?.find(acc => acc.account_type === "drawings")?.balance || 0;
  const netEquity = capital - drawings;

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Owner's Capital</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{capital.toLocaleString()} AED</div>
              <p className="text-xs text-muted-foreground">Total contributions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Owner's Drawings</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{drawings.toLocaleString()} AED</div>
              <p className="text-xs text-muted-foreground">Total withdrawals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Equity</CardTitle>
              <PiggyBank className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{netEquity.toLocaleString()} AED</div>
              <p className="text-xs text-muted-foreground">Capital - Drawings</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Owner's Equity Transactions</CardTitle>
                <CardDescription>Capital contributions and owner drawings</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setTransactionType("Capital Contribution");
                    setShowDialog(true);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Add Capital
                </Button>
                <Button
                  onClick={() => {
                    setTransactionType("Owner Drawing");
                    setShowDialog(true);
                  }}
                  variant="destructive"
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Record Drawing
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions?.map((tx: any) => (
                <div key={tx.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {tx.transaction_type === "Capital Contribution" ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{tx.transaction_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(tx.transaction_date), "dd MMM yyyy")}
                      </p>
                      {tx.notes && <p className="text-sm text-muted-foreground mt-1">{tx.notes}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${
                      tx.transaction_type === "Capital Contribution" ? "text-green-600" : "text-red-600"
                    }`}>
                      {tx.transaction_type === "Capital Contribution" ? "+" : "-"}
                      {tx.amount.toLocaleString()} AED
                    </p>
                    {tx.bank_accounts && (
                      <p className="text-sm text-muted-foreground">{tx.bank_accounts.account_name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{transactionType}</DialogTitle>
            <DialogDescription>
              {transactionType === "Capital Contribution"
                ? "Record money put into the business by the owner"
                : "Record money withdrawn from the business by the owner"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (AED) *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Bank Account</Label>
              <Select value={formData.bank_account_id} onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts?.map((bank: any) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.account_name} - {bank.current_balance.toLocaleString()} AED
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes or description"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createTransactionMutation.mutate({ ...formData, type: transactionType })}
              disabled={formData.amount <= 0 || createTransactionMutation.isPending}
              className={transactionType === "Capital Contribution" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {createTransactionMutation.isPending ? "Recording..." : "Record Transaction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
