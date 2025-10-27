import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit, Folder } from "lucide-react";

interface ExpenseCategory {
  id: string;
  category_name: string;
  account_type: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}

export default function ExpenseCategoriesManagement() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [formData, setFormData] = useState({
    category_name: "",
    account_type: "OPEX",
    description: "",
    is_active: true,
    sort_order: 0,
  });
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories" as any)
        .select("*")
        .order("account_type", { ascending: true })
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as unknown as ExpenseCategory[];
    },
  });

  const saveCategoryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingCategory) {
        const { error } = await supabase
          .from("expense_categories" as any)
          .update(data)
          .eq("id", editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("expense_categories" as any)
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      setShowDialog(false);
      resetForm();
      toast.success(editingCategory ? "Category updated" : "Category created");
    },
    onError: (error: any) => {
      toast.error("Failed to save category", {
        description: error.message,
      });
    },
  });

  const handleEdit = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setFormData({
      category_name: category.category_name,
      account_type: category.account_type,
      description: category.description || "",
      is_active: category.is_active,
      sort_order: category.sort_order,
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      category_name: "",
      account_type: "OPEX",
      description: "",
      is_active: true,
      sort_order: 0,
    });
  };

  const getAccountTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      REVENUE: "bg-green-100 text-green-800",
      COGS: "bg-blue-100 text-blue-800",
      OPEX: "bg-orange-100 text-orange-800",
      ASSET: "bg-purple-100 text-purple-800",
      LIABILITY: "bg-red-100 text-red-800",
      EQUITY: "bg-indigo-100 text-indigo-800",
    };
    return <Badge className={colors[type] || ""}>{type}</Badge>;
  };

  const groupedCategories = categories?.reduce((acc, cat) => {
    if (!acc[cat.account_type]) acc[cat.account_type] = [];
    acc[cat.account_type].push(cat);
    return acc;
  }, {} as Record<string, ExpenseCategory[]>);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p>Loading categories...</p>
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
                <CardTitle>Chart of Accounts</CardTitle>
                <CardDescription>Manage expense categories and account structure</CardDescription>
              </div>
              <Button onClick={() => { resetForm(); setShowDialog(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedCategories || {}).map(([type, cats]) => (
                <div key={type} className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Folder className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">{type}</h3>
                    {getAccountTypeBadge(type)}
                    <span className="text-sm text-muted-foreground">({cats.length} categories)</span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sort Order</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cats.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.category_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{category.description}</TableCell>
                          <TableCell>
                            {category.is_active ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>{category.sort_order}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(category)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Update the expense category details" : "Create a new expense category in the chart of accounts"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category Name *</Label>
              <Input
                value={formData.category_name}
                onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                placeholder="e.g., Office Rent"
              />
            </div>

            <div className="space-y-2">
              <Label>Account Type *</Label>
              <Select value={formData.account_type} onValueChange={(value) => setFormData({ ...formData, account_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REVENUE">Revenue</SelectItem>
                  <SelectItem value="COGS">Cost of Goods Sold (COGS)</SelectItem>
                  <SelectItem value="OPEX">Operating Expenses (OPEX)</SelectItem>
                  <SelectItem value="ASSET">Asset</SelectItem>
                  <SelectItem value="LIABILITY">Liability</SelectItem>
                  <SelectItem value="EQUITY">Equity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this category"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={() => saveCategoryMutation.mutate(formData)}
              disabled={!formData.category_name || saveCategoryMutation.isPending}
            >
              {saveCategoryMutation.isPending ? "Saving..." : editingCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
