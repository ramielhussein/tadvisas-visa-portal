import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, FileText, Eye, Edit, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Contract {
  id: string;
  contract_number: string;
  client_name: string;
  client_phone: string;
  contract_date: string;
  start_date: string;
  status: string;
  total_amount: number;
  product_id: string;
  products: {
    code: string;
    name: string;
  };
}

const ContractManagement = () => {
  const { data: contracts = [], isLoading, refetch } = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          products (
            code,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Contract[];
    }
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Draft': return 'secondary';
      case 'Completed': return 'outline';
      case 'Cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Contract Management</h1>
              <p className="text-muted-foreground">Manage client contracts and agreements</p>
            </div>
            <Button asChild>
              <Link to="/contracts/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Contract
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : contracts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No contracts found</p>
                <p className="text-muted-foreground mb-4">Create your first contract to get started</p>
                <Button asChild>
                  <Link to="/contracts/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Contract
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>All Contracts ({contracts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Contract Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">{contract.contract_number}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{contract.client_name}</span>
                            <span className="text-sm text-muted-foreground">{contract.client_phone}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{contract.products.code}</Badge>
                          <span className="ml-2 text-sm">{contract.products.name}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(contract.contract_date), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          AED {Number(contract.total_amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(contract.status)}>
                            {contract.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ContractManagement;
