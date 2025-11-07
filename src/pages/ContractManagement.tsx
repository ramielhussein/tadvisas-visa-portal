import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, FileText, Eye, Edit, Calendar, XCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";

interface Contract {
  id: string;
  contract_number: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  contract_date: string;
  start_date: string;
  status: string;
  total_amount: number;
  base_amount: number;
  vat_amount: number;
  vat_rate: number;
  product_id: string;
  worker_id: string;
  products: {
    code: string;
    name: string;
  };
  workers?: {
    name: string;
    nationality_code: string;
    salary: number;
  };
}

const ContractManagement = () => {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
          ),
          workers (
            name,
            nationality_code,
            salary
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Contract[];
    }
  });

  const cancelContractMutation = useMutation({
    mutationFn: async (contract: Contract) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const now = new Date().toISOString();

      // Step 1: Mark contract as cancelled
      const { error: contractError } = await supabase
        .from('contracts')
        .update({
          status: 'Cancelled',
          cancelled_at: now,
        })
        .eq('id', contract.id);

      if (contractError) throw contractError;

      // Step 2: Calculate days worked
      const startDate = new Date(contract.start_date);
      const cancelDate = new Date();
      const daysWorked = Math.floor((cancelDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Step 3: Create refund record with pre-filled data
      const { data: refund, error: refundError } = await supabase
        .from('refunds')
        .insert({
          contract_no: contract.contract_number,
          client_name: contract.client_name,
          client_mobile: contract.client_phone,
          emirate: 'Not specified', // Should come from contract/deal if available
          worker_name: contract.workers?.name || 'Unknown',
          nationality: contract.workers?.nationality_code || 'Unknown',
          location: 'Not specified', // Should come from contract/deal if available
          status: 'draft',
          price_incl_vat: Number(contract.total_amount),
          base_price_ex_vat: Number(contract.base_amount),
          vat_amount: Number(contract.vat_amount),
          vat_percent: Number(contract.vat_rate || 5),
          salary_aed: contract.workers?.salary || 0,
          delivered_date: contract.start_date,
          returned_date: now.split('T')[0], // Today's date as YYYY-MM-DD
          days_worked: daysWorked > 0 ? daysWorked : 0,
          total_refund_amount: 0, // To be calculated by finance
          prepared_by: user.id,
          notes: `Auto-created from cancelled contract ${contract.contract_number} on ${format(new Date(), 'dd MMM yyyy')}`,
        })
        .select()
        .single();

      if (refundError) throw refundError;

      return { contract, refund };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setCancelDialogOpen(false);
      setSelectedContract(null);
      
      toast.success("Contract cancelled and refund draft created", {
        description: `Refund draft created. Complete it in Refunds Management.`,
      });
      
      // Navigate to refunds approval page
      navigate('/finance/refunds-approval');
    },
    onError: (error: any) => {
      toast.error("Failed to cancel contract", {
        description: error.message,
      });
    },
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
              <Link to="/crm/contracts/create">
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
                  <Link to="/crm/contracts/create">
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
                            {contract.status !== 'Cancelled' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedContract(contract);
                                  setCancelDialogOpen(true);
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
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

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Contract</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel contract {selectedContract?.contract_number}? 
              This will create a refund request that requires finance approval.
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm font-medium text-yellow-900">Contract Details:</p>
                <ul className="mt-2 space-y-1 text-sm text-yellow-800">
                  <li>• Client: {selectedContract?.client_name}</li>
                  <li>• Amount: {selectedContract?.total_amount.toLocaleString()} AED</li>
                  <li>• Worker: {selectedContract?.workers?.name}</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep Contract</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedContract && cancelContractMutation.mutate(selectedContract)}
              className="bg-red-600 hover:bg-red-700"
              disabled={cancelContractMutation.isPending}
            >
              {cancelContractMutation.isPending ? "Cancelling..." : "Yes, Cancel Contract"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default ContractManagement;
