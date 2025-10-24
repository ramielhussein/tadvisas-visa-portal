import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { DollarSign, TrendingUp, FileText, AlertCircle, Users } from "lucide-react";

interface FinancialStats {
  totalRevenue: number;
  totalOutstanding: number;
  totalPaid: number;
  pendingInvoices: number;
  overdueInvoices: number;
  activeDeals: number;
  totalCommissions: number;
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

const FinancialDashboard = () => {
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
  });
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);

      // Fetch invoice stats
      const { data: invoices } = await supabase.from("invoices").select("*");
      
      // Fetch deals stats
      const { data: deals } = await supabase.from("deals").select("*");

      // Fetch account balances
      const { data: balances } = await supabase.from("account_balances").select("*");

      if (invoices) {
        const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
        const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paid_amount), 0);
        const totalOutstanding = invoices.reduce((sum, inv) => sum + Number(inv.balance_due), 0);
        const pendingInvoices = invoices.filter(inv => inv.status === 'Pending').length;
        const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue').length;

        const totalCommissions = deals?.reduce((sum, d) => sum + Number(d.commission_amount || 0), 0) || 0;
        const activeDeals = deals?.filter(d => d.status === 'Active').length || 0;

        setStats({
          totalRevenue,
          totalPaid,
          totalOutstanding,
          pendingInvoices,
          overdueInvoices,
          activeDeals,
          totalCommissions,
        });
      }

      setAccountBalances(balances || []);
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
          </div>

          {/* Account Receivables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Account Receivables (AR Aging)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accountBalances.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No outstanding balances
                </p>
              ) : (
                <div className="space-y-3">
                  {accountBalances.map((balance, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{balance.client_name}</p>
                        <p className="text-sm text-muted-foreground">{balance.client_phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">
                          AED {Number(balance.total_outstanding).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Invoiced: AED {Number(balance.total_invoiced).toLocaleString()} | 
                          Paid: AED {Number(balance.total_paid).toLocaleString()}
                        </p>
                        <p className="text-xs mt-1">
                          {balance.pending_invoices > 0 && (
                            <span className="text-orange-600">{balance.pending_invoices} pending </span>
                          )}
                          {balance.overdue_invoices > 0 && (
                            <span className="text-red-600">{balance.overdue_invoices} overdue</span>
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
    </Layout>
  );
};

export default FinancialDashboard;
