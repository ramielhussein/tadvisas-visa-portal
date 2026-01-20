import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, DollarSign, TrendingUp, AlertCircle, FileText, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, differenceInMonths } from "date-fns";

interface ContractRevenue {
  id: string;
  contract_number: string;
  client_name: string;
  client_phone: string;
  start_date: string;
  end_date: string;
  duration_months: number;
  monthly_amount: number;
  total_amount: number;
  status: string;
  product_name: string;
  worker_name: string;
  months_elapsed: number;
  expected_revenue_to_date: number;
  total_paid: number;
  outstanding_ar: number;
}

const ContractRevenue = () => {
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contract-revenue'],
    queryFn: async () => {
      // Fetch deals (contracts) with optional related worker data
      // NOTE: Use a LEFT join so deals without a linked worker are still returned.
      const { data: contractsData, error: contractsError } = await supabase
        .from('deals')
        .select(`
          *,
          workers!left(name)
        `)
        .eq('status', 'Active')
        .order('created_at', { ascending: false });

      if (contractsError) throw contractsError;

      // Then fetch payments for each deal's client
      const contractsWithRevenue = await Promise.all(
        (contractsData || []).map(async (deal) => {
          const { data: payments } = await supabase
            .from('payments')
            .select('amount')
            .eq('deal_id', deal.id);

          const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
          
          // Calculate months elapsed since start date
          const startDate = deal.start_date ? new Date(deal.start_date) : new Date();
          const today = new Date();
          const monthsElapsed = differenceInMonths(today, startDate);
          
          // Parse duration from service_description (e.g., "P4 Monthly (24 months)")
          let durationMonths = 0;
          let monthlyAmount = 0;
          if (deal.service_description) {
            const durationMatch = deal.service_description.match(/\((\d+)\s*months?\)/i);
            if (durationMatch) {
              durationMonths = parseInt(durationMatch[1], 10);
              monthlyAmount = durationMonths > 0 ? Number(deal.total_amount) / durationMonths : 0;
            }
          }
          
          // Calculate expected revenue to date (for monthly contracts)
          const expectedMonths = Math.min(Math.max(monthsElapsed, 1), durationMonths || 1);
          const expectedRevenueToDate = durationMonths > 0 ? monthlyAmount * expectedMonths : Number(deal.total_amount);
          
          // Calculate A/R (Outstanding)
          const outstandingAR = expectedRevenueToDate - totalPaid;

          return {
            id: deal.id,
            contract_number: deal.deal_number,
            client_name: deal.client_name,
            client_phone: deal.client_phone,
            start_date: deal.start_date || '',
            end_date: deal.end_date || '',
            duration_months: durationMonths,
            monthly_amount: monthlyAmount,
            total_amount: Number(deal.total_amount),
            status: deal.status,
            product_name: deal.service_type || 'N/A',
            worker_name: deal.workers?.name || deal.worker_name || 'N/A',
            months_elapsed: monthsElapsed,
            expected_revenue_to_date: expectedRevenueToDate,
            total_paid: totalPaid,
            outstanding_ar: outstandingAR
          } as ContractRevenue;
        })
      );

      return contractsWithRevenue;
    }
  });

  // Calculate summary statistics
  const stats = {
    totalContracts: contracts.length,
    totalContractValue: contracts.reduce((sum, c) => sum + c.total_amount, 0),
    totalExpectedToDate: contracts.reduce((sum, c) => sum + c.expected_revenue_to_date, 0),
    totalCollected: contracts.reduce((sum, c) => sum + c.total_paid, 0),
    totalOutstanding: contracts.reduce((sum, c) => sum + Math.max(0, c.outstanding_ar), 0),
    activeContracts: contracts.filter(c => c.status === 'Active').length,
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Draft': return 'secondary';
      case 'Completed': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Contract Revenue & A/R</h1>
            <p className="text-muted-foreground">
              Track recurring contract revenue and accounts receivable
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Total Contracts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalContracts}</p>
                <p className="text-xs text-muted-foreground">{stats.activeContracts} active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Total Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">AED {stats.totalContractValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">All contracts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Expected To Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">AED {stats.totalExpectedToDate.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Earned to date</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Collected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  AED {stats.totalCollected.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalExpectedToDate > 0 
                    ? `${((stats.totalCollected / stats.totalExpectedToDate) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  Outstanding A/R
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">
                  AED {stats.totalOutstanding.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">To be collected</p>
              </CardContent>
            </Card>
          </div>

          {/* Contracts Table */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Contract Revenue Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contract #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Monthly</TableHead>
                        <TableHead className="text-right">Duration</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                        <TableHead className="text-right">Expected</TableHead>
                        <TableHead className="text-right">Collected</TableHead>
                        <TableHead className="text-right">A/R</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell className="font-medium">
                            {contract.contract_number}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{contract.client_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {contract.client_phone}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{contract.product_name}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {contract.monthly_amount > 0 
                              ? `AED ${contract.monthly_amount.toLocaleString()}`
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {contract.duration_months > 0 
                              ? `${contract.duration_months} months`
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            AED {contract.total_amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            AED {contract.expected_revenue_to_date.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            AED {contract.total_paid.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {contract.outstanding_ar > 0 ? (
                              <span className="text-orange-600 font-medium">
                                AED {contract.outstanding_ar.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-green-600">Paid</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(contract.status)}>
                              {contract.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ContractRevenue;
