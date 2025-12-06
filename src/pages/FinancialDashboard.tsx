import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { DollarSign, TrendingUp, FileText, AlertCircle, Users, Building2, Eye, Calendar, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, differenceInMonths, addMonths } from "date-fns";

interface FinancialStats {
  totalRevenue: number;
  totalOutstanding: number;
  totalPaid: number;
  pendingInvoices: number;
  overdueInvoices: number;
  activeDeals: number;
  totalCommissions: number;
  totalPayable: number;
  suppliersPending: number;
}

interface AccountBalance {
  client_name: string;
  client_phone: string;
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
  pending_invoices: number;
  overdue_invoices: number;
}

interface ContractAR {
  id: string;
  contract_number: string;
  client_name: string;
  start_date: string;
  end_date: string;
  duration_months: number;
  monthly_amount: number;
  total_amount: number;
  months_elapsed: number;
  months_remaining: number;
  expected_revenue_to_date: number;
  total_paid: number;
  current_ar: number;
  future_ar: number;
  next_payment_date: string;
  status: string;
}

const FinancialDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    totalOutstanding: 0,
    totalPaid: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    activeDeals: 0,
    totalCommissions: 0,
    totalPayable: 0,
    suppliersPending: 0,
  });
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [supplierBalances, setSupplierBalances] = useState<any[]>([]);
  const [contractsAR, setContractsAR] = useState<ContractAR[]>([]);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);

      // Fetch invoice stats
      const { data: invoices } = await supabase.from("invoices").select("*");
      
      // Fetch deals stats - only Active deals for sales figures
      const { data: deals } = await supabase
        .from("deals")
        .select("*")
        .eq("status", "Active");

      // Fetch account balances
      const { data: balances } = await supabase.from("account_balances").select("*");

      // Fetch supplier balances
      const { data: suppliers } = await supabase.from("supplier_balances").select("*");

      // Calculate sales from active deals
      const totalSalesRevenue = deals?.reduce((sum, d) => sum + Number(d.total_amount || 0), 0) || 0;
      const totalPaidFromDeals = deals?.reduce((sum, d) => sum + Number(d.paid_amount || 0), 0) || 0;
      const totalOutstandingFromDeals = deals?.reduce((sum, d) => sum + Number(d.balance_due || 0), 0) || 0;
      const totalCommissions = deals?.reduce((sum, d) => sum + Number(d.commission_amount || 0), 0) || 0;
      const activeDeals = deals?.length || 0;

      // Invoice stats for pending/overdue counts
      const pendingInvoices = invoices?.filter(inv => inv.status === 'Pending').length || 0;
      const overdueInvoices = invoices?.filter(inv => inv.status === 'Overdue').length || 0;

      const totalPayable = suppliers?.reduce((sum, s) => sum + Number(s.total_outstanding || 0), 0) || 0;
      const suppliersPending = suppliers?.reduce((sum, s) => sum + Number(s.pending_invoices || 0), 0) || 0;

      setStats({
        totalRevenue: totalSalesRevenue,
        totalPaid: totalPaidFromDeals,
        totalOutstanding: totalOutstandingFromDeals,
        pendingInvoices,
        overdueInvoices,
        activeDeals,
        totalCommissions,
        totalPayable,
        suppliersPending,
      });

      setAccountBalances(balances || []);
      setSupplierBalances(suppliers || []);

      // Fetch contracts (from deals table) with A/R tracking - only Active contracts
      const { data: contractsData } = await supabase
        .from("deals")
        .select("*")
        .eq("status", "Active")
        .not("start_date", "is", null)
        .order("start_date", { ascending: true });

      if (contractsData) {
        const contractsWithAR = await Promise.all(
          contractsData.map(async (contract) => {
            // Get payments for this deal
            const { data: payments } = await supabase
              .from("payments")
              .select("amount")
              .eq("deal_id", contract.id);

            const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || Number(contract.paid_amount || 0);
            
            const startDate = new Date(contract.start_date);
            const endDate = contract.end_date ? new Date(contract.end_date) : addMonths(startDate, 24);
            const today = new Date();
            
            const monthsElapsed = Math.max(0, differenceInMonths(today, startDate));
            const totalDuration = differenceInMonths(endDate, startDate) || 24;
            const monthsRemaining = Math.max(0, totalDuration - monthsElapsed);
            
            // Calculate monthly amount from total and duration
            const monthlyAmount = totalDuration > 0 ? Number(contract.total_amount) / totalDuration : 0;
            const expectedMonths = Math.min(monthsElapsed, totalDuration);
            const expectedRevenueToDate = monthlyAmount > 0 ? monthlyAmount * expectedMonths : Number(contract.total_amount);
            
            const currentAR = Math.max(0, expectedRevenueToDate - totalPaid);
            
            // Future A/R = Total remaining to be invoiced minus any overpayment
            // If client paid more than expected to date, reduce future A/R
            const totalRemainingOnContract = Number(contract.total_amount) - totalPaid;
            const futureAR = Math.max(0, totalRemainingOnContract - currentAR);
            
            // Calculate next payment date (1st of next month)
            const nextPaymentDate = addMonths(new Date(today.getFullYear(), today.getMonth(), 1), 1);

            return {
              id: contract.id,
              contract_number: contract.deal_number,
              client_name: contract.client_name,
              start_date: contract.start_date,
              end_date: contract.end_date || format(endDate, 'yyyy-MM-dd'),
              duration_months: totalDuration,
              monthly_amount: monthlyAmount,
              total_amount: Number(contract.total_amount),
              months_elapsed: monthsElapsed,
              months_remaining: monthsRemaining,
              expected_revenue_to_date: expectedRevenueToDate,
              total_paid: totalPaid,
              current_ar: currentAR,
              future_ar: futureAR,
              next_payment_date: format(nextPaymentDate, 'yyyy-MM-dd'),
              status: contract.status
            } as ContractAR;
          })
        );

        setContractsAR(contractsWithAR);
      }
    } catch (error: any) {
      console.error("Error fetching financial data:", error);
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading financial data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8">Financial Dashboard</h1>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">AED {stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">All invoices</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Collected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">AED {stats.totalPaid.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalRevenue > 0 
                    ? `${((stats.totalPaid / stats.totalRevenue) * 100).toFixed(1)}% of total`
                    : '0%'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  Outstanding (AR)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">AED {stats.totalOutstanding.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.pendingInvoices} pending, {stats.overdueInvoices} overdue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Commissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">AED {stats.totalCommissions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  From {stats.activeDeals} active deals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Payable (A/P)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">AED {stats.totalPayable.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.suppliersPending} pending bills
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contract A/R Tracking */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Contract A/R Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contractsAR.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No active contracts found
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contract #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead className="text-right">Monthly</TableHead>
                        <TableHead className="text-center">Months Left</TableHead>
                        <TableHead className="text-right">Current A/R</TableHead>
                        <TableHead className="text-right">Future A/R</TableHead>
                        <TableHead>Next Payment</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contractsAR.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell className="font-mono text-xs">
                            {contract.contract_number}
                          </TableCell>
                          <TableCell className="font-medium">
                            {contract.client_name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(contract.start_date), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {contract.monthly_amount > 0 
                              ? `AED ${contract.monthly_amount.toLocaleString()}`
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">
                              {contract.months_remaining} / {contract.duration_months}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {contract.current_ar > 0 ? (
                              <span className="text-orange-600 font-semibold">
                                AED {contract.current_ar.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-green-600">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            AED {contract.future_ar.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs">
                              <Clock className="h-3 w-3" />
                              {format(new Date(contract.next_payment_date), 'MMM dd')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={contract.status === 'Active' ? 'default' : 'secondary'}>
                              {contract.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Two Column Layout for A/R and A/P */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Receivables */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Account Receivables (A/R)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {accountBalances.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No outstanding balances
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {accountBalances.map((balance, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{balance.client_name}</p>
                          <p className="text-sm text-muted-foreground">{balance.client_phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-orange-600">
                            AED {Number(balance.total_outstanding).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {balance.pending_invoices > 0 && (
                              <span className="text-orange-600">{balance.pending_invoices} pending </span>
                            )}
                            {balance.overdue_invoices > 0 && (
                              <span className="text-red-600">{balance.overdue_invoices} overdue</span>
                            )}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/client-statement?phone=${balance.client_phone}&name=${encodeURIComponent(balance.client_name)}`)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Statement
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Payables */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Account Payables (A/P)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {supplierBalances.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No supplier balances
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {supplierBalances.map((supplier, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{supplier.supplier_name}</p>
                          <p className="text-sm text-muted-foreground">{supplier.supplier_type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">
                            AED {Number(supplier.total_outstanding).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {supplier.pending_invoices > 0 && (
                              <span className="text-orange-600">{supplier.pending_invoices} pending </span>
                            )}
                            {supplier.overdue_invoices > 0 && (
                              <span className="text-red-600">{supplier.overdue_invoices} overdue</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FinancialDashboard;
