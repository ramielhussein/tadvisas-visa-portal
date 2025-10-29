import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateReceiptDialog } from "@/components/product/CreateReceiptDialog";
import { format } from "date-fns";

const ReceiptOrders = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: receiptOrders, isLoading } = useQuery({
    queryKey: ["receipt-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receipt_orders")
        .select(`
          *,
          workers(name, passport_no),
          purchase_orders(po_number)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-500";
      case "Pending": return "bg-yellow-500";
      case "Cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Receipt Orders</h1>
            <p className="text-muted-foreground">Record worker arrivals and receipt locations</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Receipt
          </Button>
        </div>

        <div className="bg-card rounded-lg border">
          {isLoading ? (
            <div className="p-8 text-center">Loading receipt orders...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Received From</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receiptOrders?.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-medium">{receipt.receipt_number}</TableCell>
                    <TableCell>{receipt.workers?.name || "N/A"}</TableCell>
                    <TableCell>{receipt.purchase_orders?.po_number || "N/A"}</TableCell>
                    <TableCell>{receipt.location}</TableCell>
                    <TableCell>{receipt.received_from}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(receipt.status)}>
                        {receipt.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(receipt.receipt_date), "dd MMM yyyy HH:mm")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <CreateReceiptDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </div>
    </Layout>
  );
};

export default ReceiptOrders;
