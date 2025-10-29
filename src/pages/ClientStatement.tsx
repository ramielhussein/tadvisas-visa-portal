import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, DollarSign, Clock } from "lucide-react";
import { formatPhoneDisplay } from "@/lib/phoneValidation";

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: string;
}

interface Payment {
  id: string;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_method: string | null;
  reference_number: string | null;
  invoice_id: string;
}

interface Transaction {
  type: "invoice" | "payment";
  date: string;
  number: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  status?: string;
  invoice_id?: string;
}

const ClientStatement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const clientPhone = searchParams.get("phone");
  const clientName = searchParams.get("name");

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (clientPhone) {
      fetchClientData();
    }
  }, [clientPhone]);

  const fetchClientData = async () => {
    if (!clientPhone) return;

    try {
      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .eq("client_phone", clientPhone)
        .order("invoice_date", { ascending: true });

      if (invoicesError) throw invoicesError;

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("client_phone", clientPhone)
        .order("payment_date", { ascending: true });

      if (paymentsError) throw paymentsError;

      setInvoices(invoicesData || []);
      setPayments(paymentsData || []);

      // Build transaction ledger
      buildTransactionLedger(invoicesData || [], paymentsData || []);
    } catch (error: any) {
      console.error("Error fetching client data:", error);
      toast({
        title: "Error",
        description: "Failed to load client statement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const buildTransactionLedger = (invoicesData: Invoice[], paymentsData: Payment[]) => {
    const ledger: Transaction[] = [];
    let runningBalance = 0;

    // Combine invoices and payments, sort by date
    const combined: Array<{ date: string; item: Invoice | Payment; type: "invoice" | "payment" }> = [
      ...invoicesData.map((inv) => ({ date: inv.invoice_date, item: inv, type: "invoice" as const })),
      ...paymentsData.map((pay) => ({ date: pay.payment_date, item: pay, type: "payment" as const })),
    ];

    combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Build ledger with running balance
    combined.forEach((entry) => {
      if (entry.type === "invoice") {
        const invoice = entry.item as Invoice;
        runningBalance += Number(invoice.total_amount);
        ledger.push({
          type: "invoice",
          date: invoice.invoice_date,
          number: invoice.invoice_number,
          description: `Invoice`,
          debit: Number(invoice.total_amount),
          credit: 0,
          balance: runningBalance,
          status: invoice.status,
          invoice_id: invoice.id,
        });
      } else {
        const payment = entry.item as Payment;
        runningBalance -= Number(payment.amount);
        ledger.push({
          type: "payment",
          date: payment.payment_date,
          number: payment.payment_number,
          description: payment.payment_method || "Payment",
          debit: 0,
          credit: Number(payment.amount),
          balance: runningBalance,
          invoice_id: payment.invoice_id,
        });
      }
    });

    setTransactions(ledger);
  };

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const totalPaid = payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
  const balanceDue = totalInvoiced - totalPaid;

  if (!clientPhone || !clientName) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No client selected. Please provide client phone number.
              </p>
              <Button onClick={() => navigate("/financial")} className="mt-4">
                Go to Financial Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/financial")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Financial Dashboard
        </Button>

        {/* Client Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{clientName}</h1>
          <p className="text-muted-foreground">{formatPhoneDisplay(clientPhone)}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInvoiced.toLocaleString()} AED</div>
              <p className="text-xs text-muted-foreground">
                {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalPaid.toLocaleString()} AED
              </div>
              <p className="text-xs text-muted-foreground">
                {payments.length} payment{payments.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Balance Due</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balanceDue > 0 ? "text-orange-600" : "text-green-600"}`}>
                {balanceDue.toLocaleString()} AED
              </div>
              <p className="text-xs text-muted-foreground">
                {balanceDue > 0 ? "Outstanding" : "Fully paid"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Ledger */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Date</th>
                    <th className="text-left p-4 font-medium">Type</th>
                    <th className="text-left p-4 font-medium">Number</th>
                    <th className="text-left p-4 font-medium">Description</th>
                    <th className="text-right p-4 font-medium">Debit</th>
                    <th className="text-right p-4 font-medium">Credit</th>
                    <th className="text-right p-4 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-muted-foreground">
                        No transactions found for this client
                      </td>
                    </tr>
                  ) : (
                    transactions.map((txn, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <span className="text-sm">
                            {new Date(txn.date).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge variant={txn.type === "invoice" ? "default" : "secondary"}>
                            {txn.type === "invoice" ? "Invoice" : "Payment"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-sm">{txn.number}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{txn.description}</span>
                            {txn.status && (
                              <Badge variant="outline" className="text-xs">
                                {txn.status}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          {txn.debit > 0 ? (
                            <span className="text-red-600 font-semibold">
                              {txn.debit.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {txn.credit > 0 ? (
                            <span className="text-green-600 font-semibold">
                              {txn.credit.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`font-bold ${txn.balance > 0 ? "text-orange-600" : "text-green-600"}`}>
                            {txn.balance.toLocaleString()} AED
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ClientStatement;
