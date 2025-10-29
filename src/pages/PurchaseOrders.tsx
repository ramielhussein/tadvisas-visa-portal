import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreatePODialog } from "@/components/product/CreatePODialog";
import { format } from "date-fns";

const PurchaseOrders = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: purchaseOrders, isLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          workers(name, passport_no),
          suppliers(supplier_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft": return "bg-gray-500";
      case "Pending Approval": return "bg-yellow-500";
      case "Approved": return "bg-green-500";
      case "Paid": return "bg-blue-500";
      case "Cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Purchase Orders</h1>
            <p className="text-muted-foreground">Manage worker procurement orders</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create PO
          </Button>
        </div>

        <div className="bg-card rounded-lg border">
          {isLoading ? (
            <div className="p-8 text-center">Loading purchase orders...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders?.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">{po.po_number}</TableCell>
                    <TableCell>{po.workers?.name || "N/A"}</TableCell>
                    <TableCell>{po.suppliers?.supplier_name || "N/A"}</TableCell>
                    <TableCell>{po.currency} {po.total_amount}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(po.status)}>
                        {po.status}
                      </Badge>
                    </TableCell>
                    <TableCell>Product Team</TableCell>
                    <TableCell>{format(new Date(po.po_date), "dd MMM yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <CreatePODialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </div>
    </Layout>
  );
};

export default PurchaseOrders;
