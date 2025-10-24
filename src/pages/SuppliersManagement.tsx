import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Search, Plus, Building2, AlertCircle, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";

const supplierSchema = z.object({
  supplier_name: z.string().min(1, "Supplier name required").max(200),
  supplier_type: z.string().min(1, "Type required"),
  contact_person: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(255).optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  tax_registration: z.string().max(100).optional(),
  payment_terms: z.string(),
  currency: z.enum(["AED", "USD"]),
  notes: z.string().max(2000).optional(),
});

interface SupplierBalance {
  supplier_id: string;
  supplier_name: string;
  supplier_type: string;
  phone: string;
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
  pending_invoices: number;
  overdue_invoices: number;
}

const SuppliersManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [supplierBalances, setSupplierBalances] = useState<SupplierBalance[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBalances, setFilteredBalances] = useState<SupplierBalance[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    supplier_name: "",
    supplier_type: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    tax_registration: "",
    payment_terms: "Net 30",
    currency: "AED",
    notes: "",
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredBalances(
        supplierBalances.filter((s) =>
          s.supplier_name.toLowerCase().includes(query) ||
          s.phone?.includes(query)
        )
      );
    } else {
      setFilteredBalances(supplierBalances);
    }
  }, [searchQuery, supplierBalances]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("supplier_balances")
        .select("*");

      if (error) throw error;
      setSupplierBalances(data || []);
      setFilteredBalances(data || []);
    } catch (error: any) {
      console.error("Error fetching suppliers:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = supplierSchema.parse({
        supplier_name: formData.supplier_name.trim(),
        supplier_type: formData.supplier_type,
        contact_person: formData.contact_person.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        tax_registration: formData.tax_registration.trim() || undefined,
        payment_terms: formData.payment_terms,
        notes: formData.notes.trim() || undefined,
      });

      setSubmitting(true);

      const { error } = await supabase.from("suppliers").insert({
        ...validated,
        status: "Active",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Supplier added successfully",
      });

      setShowAddDialog(false);
      setFormData({
        supplier_name: "",
        supplier_type: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        tax_registration: "",
        payment_terms: "Net 30",
        currency: "AED",
        notes: "",
      });

      fetchSuppliers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add supplier",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const totalOutstanding = supplierBalances.reduce(
    (sum, s) => sum + (Number(s.total_outstanding) || 0),
    0
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading suppliers...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">Suppliers & Accounts Payable</h1>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Supplier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Supplier</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supplier_name">Supplier Name *</Label>
                      <Input
                        id="supplier_name"
                        required
                        value={formData.supplier_name}
                        onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supplier_type">Type *</Label>
                      <Select
                        value={formData.supplier_type}
                        onValueChange={(value) => setFormData({ ...formData, supplier_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Agency">Agency</SelectItem>
                          <SelectItem value="Typing Center">Typing Center</SelectItem>
                          <SelectItem value="Medical Center">Medical Center</SelectItem>
                          <SelectItem value="Government Fee">Government Fee</SelectItem>
                          <SelectItem value="Insurance Provider">Insurance Provider</SelectItem>
                          <SelectItem value="Vendor">Vendor</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact_person">Contact Person</Label>
                      <Input
                        id="contact_person"
                        value={formData.contact_person}
                        onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tax_registration">Tax Registration</Label>
                      <Input
                        id="tax_registration"
                        value={formData.tax_registration}
                        onChange={(e) => setFormData({ ...formData, tax_registration: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => setFormData({ ...formData, currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AED">AED</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payment_terms">Payment Terms</Label>
                      <Select
                        value={formData.payment_terms}
                        onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Net 7">Net 7</SelectItem>
                          <SelectItem value="Net 15">Net 15</SelectItem>
                          <SelectItem value="Net 30">Net 30</SelectItem>
                          <SelectItem value="Net 60">Net 60</SelectItem>
                          <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Adding..." : "Add Supplier"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Summary Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Suppliers</p>
                    <p className="text-2xl font-bold">{supplierBalances.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <DollarSign className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Payable (A/P)</p>
                    <p className="text-2xl font-bold text-orange-600">
                      AED {totalOutstanding.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Suppliers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Total Invoiced</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBalances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No suppliers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBalances.map((supplier) => (
                        <TableRow key={supplier.supplier_id}>
                          <TableCell className="font-medium">
                            {supplier.supplier_name}
                          </TableCell>
                          <TableCell>{supplier.supplier_type}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {supplier.phone || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(supplier.total_invoiced || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {Number(supplier.total_paid || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-bold text-orange-600">
                            {Number(supplier.total_outstanding || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {supplier.pending_invoices > 0 && (
                              <Badge variant="outline" className="mr-1">
                                {supplier.pending_invoices} pending
                              </Badge>
                            )}
                            {supplier.overdue_invoices > 0 && (
                              <Badge variant="destructive">
                                {supplier.overdue_invoices} overdue
                              </Badge>
                            )}
                            {supplier.pending_invoices === 0 && supplier.overdue_invoices === 0 && (
                              <Badge variant="outline" className="bg-green-50">
                                Up to date
                              </Badge>
                            )}
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
    </Layout>
  );
};

export default SuppliersManagement;
