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
import { Plus, Settings, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Expense {
  id: string;
  transaction_number: string;
  transaction_date: string;
  amount: number;
  account_type: string;
  debit_account?: string;
  credit_account?: string;
  supplier_id?: string;
  bank_account_id?: string;
  payment_method?: string;
  notes?: string;
  status: string;
}

const ExpensesManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    amount: 0,
    category_id: "",
    supplier_id: "",
    bank_account_id: "",
    payment_method: "",
    notes: "",
  });

  // Predefined expense categories
  const categories = [
    { id: "rent", name: "Rent", account_type: "OPEX" },
    { id: "salaries", name: "Salaries & Wages", account_type: "OPEX" },
    { id: "utilities", name: "Utilities", account_type: "OPEX" },
    { id: "marketing", name: "Marketing", account_type: "OPEX" },
    { id: "office_supplies", name: "Office Supplies", account_type: "OPEX" },
    { id: "worker_cost", name: "Worker Procurement Cost", account_type: "COGS" },
    { id: "visa_fees", name: "Visa & Government Fees", account_type: "COGS" },
    { id: "medical", name: "Medical & Insurance", account_type: "COGS" },
    { id: "travel", name: "Travel & Transportation", account_type: "COGS" },
  ];

  // Fetch suppliers
  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, supplier_name")
        .eq("status", "Active")
        .order("supplier_name");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch bank accounts
  const { data: bankAccounts } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("id, account_name, current_balance")
        .eq("status", "Active")
        .order("account_name");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch expenses (transactions)
  const { data: expenses, isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .in("account_type", ["COGS", "OPEX"])
        .order("transaction_date", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as Expense[];
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("User not authenticated");

      // Get category to determine account type
      const category = categories?.find(c => c.id === data.category_id);
      if (!category) throw new Error("Invalid category");

      // Create transaction
      const { data: txData, error: txError } = await supabase.rpc('generate_transaction_number');
      if (txError) throw txError;
      
      const { error: insertError } = await supabase.from("transactions").insert([{
        transaction_number: txData,
        transaction_type: "Expense",
        transaction_date: data.transaction_date,
        amount: data.amount,
        account_type: category.account_type,
        debit_account: category.name,
        credit_account: "Bank",
        payment_method: data.payment_method || null,
        supplier_id: data.supplier_id || null,
        bank_account_id: data.bank_account_id || null,
        notes: data.notes || null,
        status: "Completed",
        created_by: user.id,
      }]);
      
      if (insertError) throw insertError;

      // Update bank balance if bank account selected
      if (data.bank_account_id) {
        const bankAccount = bankAccounts?.find(b => b.id === data.bank_account_id);
        if (bankAccount) {
          const newBalance = (bankAccount.current_balance || 0) - data.amount;
          
          const { error: bankError } = await supabase
            .from("bank_accounts")
            .update({ current_balance: newBalance })
            .eq("id", data.bank_account_id);
          
          if (bankError) throw bankError;
        }
      }

      // Update supplier balance if supplier selected
      if (data.supplier_id) {
        const { data: supplier } = await supabase
          .from("suppliers")
          .select("account_balance")
          .eq("id", data.supplier_id)
          .single();
        
        if (supplier) {
          const newBalance = (supplier.account_balance || 0) + data.amount;
          
          const { error: supplierError } = await supabase
            .from("suppliers")
            .update({ account_balance: newBalance })
            .eq("id", data.supplier_id);
          
          if (supplierError) throw supplierError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setShowDialog(false);
      resetForm();
      toast.success("Expense recorded successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to record expense", {
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setFormData({
      transaction_date: new Date().toISOString().split('T')[0],
      amount: 0,
      category_id: "",
      supplier_id: "",
      bank_account_id: "",
      payment_method: "",
      notes: "",
    });
  };

  const getCategoryBadge = (accountType: string) => {
    if (accountType === "COGS") {
      return <Badge variant="destructive">COGS</Badge>;
    }
    return <Badge variant="secondary">OPEX</Badge>;
  };

  // Calculate totals
  const cogsTotal = expenses?.filter(e => e.account_type === "COGS").reduce((sum, e) => sum + e.amount, 0) || 0;
  const opexTotal = expenses?.filter(e => e.account_type === "OPEX").reduce((sum, e) => sum + e.amount, 0) || 0;
  const totalExpenses = cogsTotal + opexTotal;

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Expenses Management</h1>
            <p className="text-muted-foreground">Track and manage business expenses</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/expense-categories")}>
              <Settings className="h-4 w-4 mr-2" />
              Manage Categories
            </Button>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalExpenses.toFixed(2)} AED</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">COGS</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{cogsTotal.toFixed(2)} AED</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">OPEX</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{opexTotal.toFixed(2)} AED</div>
            </CardContent>
          </Card>
        </div>

        {/* Expenses Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading expenses...</p>
            ) : expenses && expenses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction #</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(new Date(expense.transaction_date), "dd MMM yyyy")}</TableCell>
                      <TableCell className="font-mono text-sm">{expense.transaction_number}</TableCell>
                      <TableCell>{expense.debit_account || "N/A"}</TableCell>
                      <TableCell>{getCategoryBadge(expense.account_type)}</TableCell>
                      <TableCell>{expense.payment_method || "—"}</TableCell>
                      <TableCell className="text-right font-semibold text-red-600">
                        {expense.amount.toFixed(2)} AED
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No expenses recorded yet</p>
            )}
          </CardContent>
        </Card>

        {/* Add Expense Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record New Expense</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transaction_date">Date</Label>
                <Input
                  id="transaction_date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (AED)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount || ""}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="category_id">Expense Category *</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name} ({cat.account_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_id">Supplier (Optional)</Label>
                <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.supplier_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account_id">Bank Account</Label>
                <Select value={formData.bank_account_id} onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts?.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name} ({account.current_balance?.toFixed(2)} AED)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this expense..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>
                Cancel
              </Button>
              <Button 
                onClick={() => createExpenseMutation.mutate(formData)}
                disabled={formData.amount <= 0 || !formData.category_id || createExpenseMutation.isPending}
              >
                {createExpenseMutation.isPending ? "Recording..." : "Record Expense"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ExpensesManagement;
