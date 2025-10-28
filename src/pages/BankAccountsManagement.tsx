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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Wallet, Edit } from "lucide-react";

interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string;
  account_number?: string;
  opening_balance: number;
  current_balance: number;
  currency: string;
  status: string;
  notes?: string;
}

const BankAccountsManagement = () => {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({
    account_name: "",
    bank_name: "",
    account_number: "",
    opening_balance: 0,
    currency: "AED",
    notes: "",
  });

  // Fetch bank accounts
  const { data: bankAccounts, isLoading } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .order("account_name");
      
      if (error) throw error;
      return data as BankAccount[];
    },
  });

  const saveBankAccountMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingAccount) {
        // Update existing account
        const { error } = await supabase
          .from("bank_accounts")
          .update({
            account_name: data.account_name,
            bank_name: data.bank_name,
            account_number: data.account_number || null,
            currency: data.currency,
            notes: data.notes || null,
          })
          .eq("id", editingAccount.id);
        
        if (error) throw error;
      } else {
        // Create new account
        const { error } = await supabase
          .from("bank_accounts")
          .insert([{
            account_name: data.account_name,
            bank_name: data.bank_name,
            account_number: data.account_number || null,
            opening_balance: data.opening_balance,
            current_balance: data.opening_balance, // Set current = opening on creation
            currency: data.currency,
            status: "Active",
            notes: data.notes || null,
          }]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      setShowDialog(false);
      resetForm();
      toast.success(editingAccount ? "Bank account updated" : "Bank account created");
    },
    onError: (error: Error) => {
      toast.error("Operation failed", {
        description: error.message,
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const { error } = await supabase
        .from("bank_accounts")
        .update({ status: newStatus })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Status updated");
    },
  });

  const resetForm = () => {
    setFormData({
      account_name: "",
      bank_name: "",
      account_number: "",
      opening_balance: 0,
      currency: "AED",
      notes: "",
    });
    setEditingAccount(null);
  };

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
    setFormData({
      account_name: account.account_name,
      bank_name: account.bank_name,
      account_number: account.account_number || "",
      opening_balance: account.opening_balance,
      currency: account.currency,
      notes: account.notes || "",
    });
    setShowDialog(true);
  };

  const totalBalance = bankAccounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
  const activeAccounts = bankAccounts?.filter(acc => acc.status === "Active").length || 0;

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Bank Accounts</h1>
            <p className="text-muted-foreground">Manage your business bank accounts</p>
          </div>
          <Button onClick={() => { resetForm(); setShowDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Bank Account
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBalance.toFixed(2)} AED</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAccounts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bankAccounts?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Bank Accounts Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Bank Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading accounts...</p>
            ) : bankAccounts && bankAccounts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead className="text-right">Opening Balance</TableHead>
                    <TableHead className="text-right">Current Balance</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.account_name}</TableCell>
                      <TableCell>{account.bank_name}</TableCell>
                      <TableCell className="font-mono text-sm">{account.account_number || "—"}</TableCell>
                      <TableCell className="text-right">{account.opening_balance.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {account.current_balance.toFixed(2)}
                      </TableCell>
                      <TableCell>{account.currency}</TableCell>
                      <TableCell>
                        {account.status === "Active" ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(account)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStatusMutation.mutate({
                              id: account.id,
                              newStatus: account.status === "Active" ? "Inactive" : "Active"
                            })}
                          >
                            {account.status === "Active" ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No bank accounts yet. Create one to get started.</p>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAccount ? "Edit Bank Account" : "Add New Bank Account"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account_name">Account Name *</Label>
                <Input
                  id="account_name"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="e.g., Main Operating Account"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name *</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="e.g., Emirates NBD"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              {!editingAccount && (
                <div className="space-y-2">
                  <Label htmlFor="opening_balance">Opening Balance</Label>
                  <Input
                    id="opening_balance"
                    type="number"
                    step="0.01"
                    value={formData.opening_balance || ""}
                    onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">Set the starting balance for this account</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>
                Cancel
              </Button>
              <Button 
                onClick={() => saveBankAccountMutation.mutate(formData)}
                disabled={!formData.account_name || !formData.bank_name || saveBankAccountMutation.isPending}
              >
                {saveBankAccountMutation.isPending ? "Saving..." : editingAccount ? "Update" : "Create Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default BankAccountsManagement;
