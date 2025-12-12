import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Search, FileText, Calendar, DollarSign, User } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Refund {
  id: string;
  created_at: string;
  contract_no: string;
  client_name: string;
  worker_name: string;
  nationality: string;
  total_refund_amount: number;
  status: string;
  prepared_by: string | null;
  finalized_by: string | null;
  due_date: string | null;
  location: string;
  reason: string | null;
}

const RefundsList = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminCheckLoading } = useAdminCheck();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch refunds
  const { data: refunds = [], isLoading, refetch } = useQuery({
    queryKey: ['refunds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('refunds')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Refund[];
    }
  });

  // Filter refunds
  const filteredRefunds = refunds.filter((refund) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      refund.contract_no.toLowerCase().includes(query) ||
      refund.client_name.toLowerCase().includes(query) ||
      refund.worker_name.toLowerCase().includes(query)
    );
  });

  // Calculate totals
  const totalRefundAmount = filteredRefunds.reduce((sum, r) => sum + Number(r.total_refund_amount), 0);

  if (adminCheckLoading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Access Denied</p>
              <p className="text-muted-foreground">You need admin access to view this page</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold">Finalized Refunds</h1>
              <p className="text-sm text-muted-foreground mt-2">
                All approved and finalized refund calculations
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/finance/absconded-workers')}>
                <FileText className="w-4 h-4 mr-2" />
                Absconded Report
              </Button>
              <Button onClick={() => navigate('/refund')}>
                <FileText className="w-4 h-4 mr-2" />
                Create New Refund
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Total Refunds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{filteredRefunds.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">AED {totalRefundAmount.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {refunds.filter(r => {
                    const date = new Date(r.created_at);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by contract number, client name, or worker name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Refunds Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Finalized Refunds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Contract No</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Worker</TableHead>
                      <TableHead>Nationality</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Refund Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRefunds.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          No refunds found. Create your first refund calculation!
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRefunds.map((refund) => (
                        <TableRow key={refund.id} className="hover:bg-muted/50 cursor-pointer">
                          <TableCell>
                            {format(new Date(refund.created_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {refund.contract_no}
                          </TableCell>
                          <TableCell>{refund.client_name}</TableCell>
                          <TableCell>{refund.worker_name}</TableCell>
                          <TableCell>{refund.nationality}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {refund.location}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {refund.reason || '-'}
                          </TableCell>
                          <TableCell className="font-semibold text-primary">
                            AED {Number(refund.total_refund_amount).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {refund.due_date ? format(new Date(refund.due_date), 'MMM dd, yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-500">
                              {refund.status}
                            </Badge>
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

export default RefundsList;
