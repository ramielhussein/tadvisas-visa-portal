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
import { Plus, PiggyBank, Edit } from "lucide-react";

interface EquityAccount {
  id: string;
  account_name: string;
  account_type: string;
  owner_name?: string;
  opening_balance: number;
  current_balance: number;
  currency: string;
  notes?: string;
  is_active: boolean;
}

const EquityAccountsManagement = () => {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EquityAccount | null>(null);
  const [formData, setFormData] = useState({
    account_name: "",
    account_type: "Owner Capital",
    owner_name: "",
    opening_balance: 0,
    currency: "AED",
    notes: "",
  });

  // Fetch equity accounts
  const { data: equityAccounts, isLoading } = useQuery({
    queryKey: ["equity-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equity_accounts" as any)
        .select("*")
        .order("account_name");
      
      if (error) throw error;
      return data as any as EquityAccount[];
    },
  });

  const saveEquityAccountMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingAccount) {
        // Update existing account
        const { error } = await supabase
          .from("equity_accounts" as any)
          .update({
            account_name: data.account_name,
            account_type: data.account_type,
            owner_name: data.owner_name || null,
            currency: data.currency,
            notes: data.notes || null,
          })
          .eq("id", editingAccount.id);
        
        if (error) throw error;
      } else {
        // Create new account
        const { error } = await supabase
          .from("equity_accounts" as any)
          .insert([{
            account_name: data.account_name,
            account_type: data.account_type,
            owner_name: data.owner_name || null,
            opening_balance: data.opening_balance,
            current_balance: data.opening_balance, // Set current = opening on creation
            currency: data.currency,
            is_active: true,
            notes: data.notes || null,
          }]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equity-accounts"] });
      setShowDialog(false);
      resetForm();
      toast.success(editingAccount ? "Equity account updated" : "Equity account created");
    },
    onError: (error: Error) => {
      toast.error("Operation failed", {
        description: error.message,
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: boolean }) => {
      const { error } = await supabase
        .from("equity_accounts" as any)
        .update({ is_active: newStatus })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equity-accounts"] });
      toast.success("Status updated");
    },
  });

  const resetForm = () => {
    setFormData({
      account_name: "",
      account_type: "Owner Capital",
      owner_name: "",
      opening_balance: 0,
      currency: "AED",
      notes: "",
    });
    setEditingAccount(null);
  };

  const handleEdit = (account: EquityAccount) => {
    setEditingAccount(account);
    setFormData({
      account_name: account.account_name,
      account_type: account.account_type,
      owner_name: account.owner_name || "",
      opening_balance: account.opening_balance,
      currency: account.currency,
      notes: account.notes || "",
    });
    setShowDialog(true);
  };

  const totalEquity = equityAccounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
  const activeAccounts = equityAccounts?.filter(acc => acc.is_active).length || 0;

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Equity Accounts</h1>
            <p className="text-muted-foreground">Manage owner capital and equity accounts</p>
          </div>
          <Button onClick={() => { resetForm(); setShowDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Equity Account
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Equity</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEquity.toFixed(2)} AED</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAccounts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{equityAccounts?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Equity Accounts Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Equity Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading accounts...</p>
            ) : equityAccounts && equityAccounts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Opening Balance</TableHead>
                    <TableHead className="text-right">Current Balance</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equityAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.account_name}</TableCell>
                      <TableCell>{account.account_type}</TableCell>
                      <TableCell>{account.owner_name || "—"}</TableCell>
                      <TableCell className="text-right">{account.opening_balance.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {account.current_balance.toFixed(2)}
                      </TableCell>
                      <TableCell>{account.currency}</TableCell>
                      <TableCell>
                        {account.is_active ? (
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
                              newStatus: !account.is_active
                            })}
                          >
                            {account.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No equity accounts yet. Create one to get started.</p>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAccount ? "Edit Equity Account" : "Add New Equity Account"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account_name">Account Name *</Label>
                <Input
                  id="account_name"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="e.g., Owner 1 Capital"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_type">Account Type</Label>
                <Select value={formData.account_type} onValueChange={(value) => setFormData({ ...formData, account_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Owner Capital">Owner Capital</SelectItem>
                    <SelectItem value="Owner Drawings">Owner Drawings</SelectItem>
                    <SelectItem value="Retained Earnings">Retained Earnings</SelectItem>
                    <SelectItem value="Additional Paid-in Capital">Additional Paid-in Capital</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_name">Owner Name</Label>
                <Input
                  id="owner_name"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
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
                  <p className="text-xs text-muted-foreground">Set the starting balance for this equity account</p>
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
                onClick={() => saveEquityAccountMutation.mutate(formData)}
                disabled={!formData.account_name || saveEquityAccountMutation.isPending}
              >
                {saveEquityAccountMutation.isPending ? "Saving..." : editingAccount ? "Update" : "Create Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default EquityAccountsManagement;
