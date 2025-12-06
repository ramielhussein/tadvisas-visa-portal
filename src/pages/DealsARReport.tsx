import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { ArrowLeft, Calendar, DollarSign, AlertTriangle, CheckCircle, Clock, Search, RefreshCw } from "lucide-react";
import { format, differenceInDays, addDays, startOfMonth, endOfMonth } from "date-fns";

interface Deal {
  id: string;
  deal_number: string;
  client_name: string;
  client_phone: string;
  service_type: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  reminder_days_before: number;
  created_at: string;
  assigned_to: string | null;
}

interface MonthlyForecast {
  month: string;
  expected: number;
  received: number;
  deals: number;
}

const DealsARReport = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reminderFilter, setReminderFilter] = useState<string>("all");

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .order("end_date", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("Error fetching deals:", error);
    } else {
      setDeals(data || []);
    }
    setLoading(false);
  };

  const getDaysUntilDue = (endDate: string | null, reminderDays: number) => {
    if (!endDate) return null;
    const days = differenceInDays(new Date(endDate), new Date());
    return days;
  };

  const getReminderStatus = (deal: Deal) => {
    if (!deal.end_date) return "no-date";
    if (deal.balance_due <= 0) return "paid";
    
    const daysUntilDue = getDaysUntilDue(deal.end_date, deal.reminder_days_before);
    if (daysUntilDue === null) return "no-date";
    
    if (daysUntilDue < 0) return "overdue";
    if (daysUntilDue <= deal.reminder_days_before) return "due-soon";
    return "on-track";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "overdue":
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> Overdue</Badge>;
      case "due-soon":
        return <Badge className="bg-orange-500 gap-1"><Clock className="w-3 h-3" /> Due Soon</Badge>;
      case "paid":
        return <Badge className="bg-green-500 gap-1"><CheckCircle className="w-3 h-3" /> Paid</Badge>;
      case "on-track":
        return <Badge variant="secondary" className="gap-1"><CheckCircle className="w-3 h-3" /> On Track</Badge>;
      default:
        return <Badge variant="outline">No Date</Badge>;
    }
  };

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = 
      deal.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.deal_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.client_phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === "all" || deal.status.toLowerCase() === statusFilter.toLowerCase();
    
    const reminderStatus = getReminderStatus(deal);
    const matchesReminder = reminderFilter === "all" || reminderStatus === reminderFilter;
    
    return matchesSearch && matchesStatus && matchesReminder;
  });

  // Calculate summary stats
  const totalOutstanding = deals.reduce((sum, d) => sum + (d.balance_due || 0), 0);
  const dueSoonDeals = deals.filter(d => getReminderStatus(d) === "due-soon");
  const overdueDeals = deals.filter(d => getReminderStatus(d) === "overdue");
  const dueSoonAmount = dueSoonDeals.reduce((sum, d) => sum + (d.balance_due || 0), 0);
  const overdueAmount = overdueDeals.reduce((sum, d) => sum + (d.balance_due || 0), 0);

  // Calculate monthly forecast (next 6 months)
  const getMonthlyForecast = (): MonthlyForecast[] => {
    const months: MonthlyForecast[] = [];
    const today = new Date();
    
    for (let i = 0; i < 6; i++) {
      const monthDate = addDays(startOfMonth(today), i * 30);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthDeals = deals.filter(d => {
        if (!d.end_date) return false;
        const endDate = new Date(d.end_date);
        return endDate >= monthStart && endDate <= monthEnd;
      });
      
      months.push({
        month: format(monthDate, "MMM yyyy"),
        expected: monthDeals.reduce((sum, d) => sum + (d.balance_due || 0), 0),
        received: monthDeals.reduce((sum, d) => sum + (d.paid_amount || 0), 0),
        deals: monthDeals.length,
      });
    }
    
    return months;
  };

  const monthlyForecast = getMonthlyForecast();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/crm/deals")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Deals A/R Report</h1>
              <p className="text-muted-foreground">Track incoming payments and reminders</p>
            </div>
          </div>
          <Button onClick={fetchDeals} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">AED {totalOutstanding.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{deals.filter(d => d.balance_due > 0).length} deals with balance</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-600">Due Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">AED {dueSoonAmount.toLocaleString()}</div>
              <p className="text-xs text-orange-600/70">{dueSoonDeals.length} deals within reminder period</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">AED {overdueAmount.toLocaleString()}</div>
              <p className="text-xs text-red-600/70">{overdueDeals.length} deals past due date</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Fully Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{deals.filter(d => d.balance_due <= 0).length}</div>
              <p className="text-xs text-green-600/70">deals with no balance</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Forecast */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Monthly Payment Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {monthlyForecast.map((month, idx) => (
                <div key={idx} className="p-3 rounded-lg border bg-muted/30 text-center">
                  <p className="text-sm font-medium">{month.month}</p>
                  <p className="text-lg font-bold text-primary">AED {month.expected.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{month.deals} deal{month.deals !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by client, deal number, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Deal Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={reminderFilter} onValueChange={setReminderFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="due-soon">Due Soon</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="on-track">On Track</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Deals Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reminder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Loading deals...
                    </TableCell>
                  </TableRow>
                ) : filteredDeals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No deals found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeals.map((deal) => {
                    const reminderStatus = getReminderStatus(deal);
                    const daysUntilDue = deal.end_date ? getDaysUntilDue(deal.end_date, deal.reminder_days_before) : null;
                    
                    return (
                      <TableRow 
                        key={deal.id} 
                        className={`cursor-pointer hover:bg-muted/50 ${
                          reminderStatus === 'overdue' ? 'bg-red-50 dark:bg-red-950/10' :
                          reminderStatus === 'due-soon' ? 'bg-orange-50 dark:bg-orange-950/10' : ''
                        }`}
                        onClick={() => navigate(`/crm/deals/${deal.id}`)}
                      >
                        <TableCell className="font-mono text-sm">{deal.deal_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{deal.client_name}</p>
                            <p className="text-xs text-muted-foreground">{deal.client_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{deal.service_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {deal.start_date ? format(new Date(deal.start_date), "dd MMM yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          {deal.end_date ? (
                            <div>
                              <p>{format(new Date(deal.end_date), "dd MMM yyyy")}</p>
                              {daysUntilDue !== null && (
                                <p className={`text-xs ${daysUntilDue < 0 ? 'text-red-600' : daysUntilDue <= deal.reminder_days_before ? 'text-orange-600' : 'text-muted-foreground'}`}>
                                  {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : 
                                   daysUntilDue === 0 ? 'Due today' : `${daysUntilDue} days left`}
                                </p>
                              )}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          AED {deal.total_amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          AED {deal.paid_amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold text-orange-600">
                          AED {(deal.balance_due || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={deal.status === 'Active' ? 'default' : 'secondary'}>
                            {deal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(reminderStatus)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DealsARReport;