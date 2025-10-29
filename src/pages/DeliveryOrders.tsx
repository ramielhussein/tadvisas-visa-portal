import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateDeliveryDialog } from "@/components/product/CreateDeliveryDialog";
import { format } from "date-fns";

const DeliveryOrders = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: deliveryOrders, isLoading } = useQuery({
    queryKey: ["delivery-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_orders")
        .select(`
          *,
          workers(name, passport_no),
          contracts(contract_number)
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
            <h1 className="text-3xl font-bold">Delivery Orders</h1>
            <p className="text-muted-foreground">Track worker handover to clients</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Delivery
          </Button>
        </div>

        <div className="bg-card rounded-lg border">
          {isLoading ? (
            <div className="p-8 text-center">Loading delivery orders...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delivery #</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Contract #</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryOrders?.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-medium">{delivery.delivery_number}</TableCell>
                    <TableCell>{delivery.workers?.name || "N/A"}</TableCell>
                    <TableCell>{delivery.client_name}</TableCell>
                    <TableCell>{delivery.contracts?.contract_number || "N/A"}</TableCell>
                    <TableCell>{delivery.delivery_location}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(delivery.status)}>
                        {delivery.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(delivery.delivery_date), "dd MMM yyyy HH:mm")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <CreateDeliveryDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </div>
    </Layout>
  );
};

export default DeliveryOrders;
