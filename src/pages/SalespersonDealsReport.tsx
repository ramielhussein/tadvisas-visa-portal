import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, Calendar, User, DollarSign, TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import html2pdf from "html2pdf.js";

const SalespersonDealsReport = () => {
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>("all");
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const reportRef = useRef<HTMLDivElement>(null);

  // Fetch all salespeople
  const { data: salespeople = [] } = useQuery({
    queryKey: ["salespeople-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");
      return data || [];
    },
  });

  // Fetch deals based on filters
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["salesperson-deals", selectedSalesperson, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("deals")
        .select(`
          id,
          deal_number,
          deal_date,
          client_name,
          client_phone,
          service_type,
          total_amount,
          paid_amount,
          balance_due,
          status,
          assigned_to,
          created_at
        `)
        .gte("deal_date", startDate)
        .lte("deal_date", endDate)
        .order("deal_date", { ascending: false });

      if (selectedSalesperson !== "all") {
        query = query.eq("assigned_to", selectedSalesperson);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Get salesperson name by ID
  const getSalespersonName = (id: string) => {
    const person = salespeople.find((p) => p.id === id);
    return person?.full_name || person?.email || "Unknown";
  };

  // Calculate totals
  const totalAmount = deals.reduce((sum, deal) => sum + (deal.total_amount || 0), 0);
  const totalPaid = deals.reduce((sum, deal) => sum + (deal.paid_amount || 0), 0);
  const totalBalance = deals.reduce((sum, deal) => sum + (deal.balance_due || 0), 0);

  // Group deals by salesperson for summary
  const dealsBySalesperson = deals.reduce((acc, deal) => {
    const key = deal.assigned_to || "unassigned";
    if (!acc[key]) {
      acc[key] = { count: 0, total: 0, paid: 0 };
    }
    acc[key].count++;
    acc[key].total += deal.total_amount || 0;
    acc[key].paid += deal.paid_amount || 0;
    return acc;
  }, {} as Record<string, { count: number; total: number; paid: number }>);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Draft: "outline",
      Active: "default",
      Completed: "secondary",
      Cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    const salespersonLabel = selectedSalesperson === "all" 
      ? "All Salespeople" 
      : getSalespersonName(selectedSalesperson);

    const reportHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e3a5f; padding-bottom: 15px;">
          <h1 style="color: #1e3a5f; margin: 0;">Salesperson Deals Report</h1>
          <p style="color: #666; margin: 5px 0;">${salespersonLabel}</p>
          <p style="color: #666; margin: 5px 0;">${format(new Date(startDate), "MMM dd, yyyy")} - ${format(new Date(endDate), "MMM dd, yyyy")}</p>
          <p style="color: #999; font-size: 12px;">Generated: ${format(new Date(), "PPpp")}</p>
        </div>

        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div style="flex: 1; background: #f0f4f8; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 12px;">Total Deals</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #1e3a5f;">${deals.length}</p>
          </div>
          <div style="flex: 1; background: #f0f4f8; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 12px;">Total Value</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #1e3a5f;">AED ${totalAmount.toLocaleString()}</p>
          </div>
          <div style="flex: 1; background: #e8f5e9; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 12px;">Collected</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #16a34a;">AED ${totalPaid.toLocaleString()}</p>
          </div>
          <div style="flex: 1; background: #fff3e0; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 12px;">Outstanding</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #ea580c;">AED ${totalBalance.toLocaleString()}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #1e3a5f; color: white;">
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Deal #</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Date</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Client</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Service</th>
              ${selectedSalesperson === "all" ? '<th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Salesperson</th>' : ''}
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Amount</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Paid</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${deals.map((deal, index) => `
              <tr style="background: ${index % 2 === 0 ? '#fff' : '#f9f9f9'};">
                <td style="padding: 6px; border: 1px solid #ddd;">${deal.deal_number}</td>
                <td style="padding: 6px; border: 1px solid #ddd;">${deal.deal_date ? format(new Date(deal.deal_date), "dd/MM/yyyy") : '-'}</td>
                <td style="padding: 6px; border: 1px solid #ddd;">${deal.client_name}</td>
                <td style="padding: 6px; border: 1px solid #ddd;">${deal.service_type}</td>
                ${selectedSalesperson === "all" ? `<td style="padding: 6px; border: 1px solid #ddd;">${getSalespersonName(deal.assigned_to)}</td>` : ''}
                <td style="padding: 6px; text-align: right; border: 1px solid #ddd;">AED ${(deal.total_amount || 0).toLocaleString()}</td>
                <td style="padding: 6px; text-align: right; border: 1px solid #ddd;">AED ${(deal.paid_amount || 0).toLocaleString()}</td>
                <td style="padding: 6px; text-align: center; border: 1px solid #ddd;">${deal.status}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #1e3a5f; color: white; font-weight: bold;">
              <td colspan="${selectedSalesperson === "all" ? 5 : 4}" style="padding: 8px; border: 1px solid #ddd;">TOTAL</td>
              <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">AED ${totalAmount.toLocaleString()}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">AED ${totalPaid.toLocaleString()}</td>
              <td style="padding: 8px; border: 1px solid #ddd;"></td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px;">
          TADMAIDS | Salesperson Deals Report
        </div>
      </div>
    `;

    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `Deals_Report_${salespersonLabel.replace(/\s+/g, '_')}_${format(new Date(), "yyyyMMdd")}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const }
    };

    await html2pdf().set(opt).from(reportHTML).save();
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Salesperson Deals Report</h1>
            <p className="text-muted-foreground">View and download deals by salesperson</p>
          </div>
          <Button onClick={handleDownloadPDF} disabled={deals.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Salesperson</Label>
                <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select salesperson" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Salespeople</SelectItem>
                    {salespeople.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.full_name || person.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Deals</p>
                  <p className="text-2xl font-bold">{deals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">AED {totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Collected</p>
                  <p className="text-2xl font-bold text-green-600">AED {totalPaid.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  <p className="text-2xl font-bold text-orange-600">AED {totalBalance.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Salesperson Summary (when showing all) */}
        {selectedSalesperson === "all" && Object.keys(dealsBySalesperson).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                By Salesperson
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Object.entries(dealsBySalesperson).map(([id, data]) => (
                  <div key={id} className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="font-semibold truncate">{getSalespersonName(id)}</p>
                    <p className="text-2xl font-bold text-primary">{data.count}</p>
                    <p className="text-xs text-muted-foreground">deals</p>
                    <p className="text-sm font-medium mt-1">AED {data.total.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deals Table */}
        <Card ref={reportRef}>
          <CardHeader>
            <CardTitle className="text-lg">Deals List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : deals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No deals found for the selected criteria
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Service</TableHead>
                      {selectedSalesperson === "all" && <TableHead>Salesperson</TableHead>}
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deals.map((deal) => (
                      <TableRow key={deal.id}>
                        <TableCell className="font-medium">{deal.deal_number}</TableCell>
                        <TableCell>
                          {deal.deal_date ? format(new Date(deal.deal_date), "dd/MM/yyyy") : '-'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{deal.client_name}</p>
                            <p className="text-xs text-muted-foreground">{deal.client_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>{deal.service_type}</TableCell>
                        {selectedSalesperson === "all" && (
                          <TableCell>{getSalespersonName(deal.assigned_to)}</TableCell>
                        )}
                        <TableCell className="text-right">
                          AED {(deal.total_amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          AED {(deal.paid_amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          AED {(deal.balance_due || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(deal.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SalespersonDealsReport;
