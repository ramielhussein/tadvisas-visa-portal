import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import Layout from "@/components/Layout";
import { Search, Plus, FileText, DollarSign, TrendingUp, Clock, BarChart3, CalendarIcon, X, Download, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

interface Contract {
  id: string;
  deal_number: string;
  client_name: string;
  client_phone: string;
  service_type: string;
  deal_value: number;
  total_amount: number;
  paid_amount: number;
  status: string;
  created_at: string;
  deal_date: string | null;
  start_date: string | null;
  worker_name: string | null;
  assigned_to: string | null;
  created_by_name?: string | null;
}

const ContractsManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdminCheck();
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createdByFilter, setCreatedByFilter] = useState<string>("all");
  const [stats, setStats] = useState({
    totalContracts: 0,
    totalValue: 0,
    totalReceived: 0,
    paymentsInPeriod: 0,
    activeContracts: 0,
    closedContracts: 0,
  });

  // Get unique values for filter dropdowns
  const uniqueServices = useMemo(() => {
    const services = [...new Set(contracts.map(c => c.service_type).filter(Boolean))];
    return services.sort();
  }, [contracts]);

  const uniqueStatuses = useMemo(() => {
    const statuses = [...new Set(contracts.map(c => c.status).filter(Boolean))];
    return statuses.sort();
  }, [contracts]);

  const uniqueCreators = useMemo(() => {
    const creators = [...new Set(contracts.map(c => c.created_by_name).filter(Boolean))];
    return creators.sort() as string[];
  }, [contracts]);

  useEffect(() => {
    fetchContracts();
  }, []);

  useEffect(() => {
    filterContracts();
  }, [searchQuery, contracts, dateFrom, dateTo, serviceFilter, statusFilter, createdByFilter]);

  const filterContracts = async () => {
    let filtered = contracts;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (contract) =>
          contract.client_name.toLowerCase().includes(query) ||
          contract.client_phone.includes(query) ||
          contract.deal_number.toLowerCase().includes(query) ||
          (contract.worker_name && contract.worker_name.toLowerCase().includes(query))
      );
    }

    // Service type filter
    if (serviceFilter && serviceFilter !== "all") {
      filtered = filtered.filter((c) => c.service_type === serviceFilter);
    }

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Created by filter
    if (createdByFilter && createdByFilter !== "all") {
      filtered = filtered.filter((c) => c.created_by_name === createdByFilter);
    }

    // Date range filter (based on deal_date)
    if (dateFrom) {
      filtered = filtered.filter((c) => {
        const dealDateStr = c.deal_date || c.start_date;
        if (!dealDateStr) return false;
        const contractDate = new Date(dealDateStr);
        contractDate.setHours(0, 0, 0, 0);
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        return contractDate >= fromDate;
      });
    }

    if (dateTo) {
      filtered = filtered.filter((c) => {
        const dealDateStr = c.deal_date || c.start_date;
        if (!dealDateStr) return false;
        const contractDate = new Date(dealDateStr);
        contractDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        return contractDate <= toDate;
      });
    }

    setFilteredContracts(filtered);

    // Calculate payments received in the selected date period
    let paymentsInPeriod = 0;
    if (dateFrom || dateTo) {
      let paymentQuery = supabase.from("payments").select("amount, payment_date");
      
      if (dateFrom) {
        paymentQuery = paymentQuery.gte("payment_date", format(dateFrom, "yyyy-MM-dd"));
      }
      if (dateTo) {
        paymentQuery = paymentQuery.lte("payment_date", format(dateTo, "yyyy-MM-dd"));
      }
      
      const { data: payments } = await paymentQuery;
      paymentsInPeriod = (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    }

    // Update stats based on filtered data - exclude Void contracts from count
    const nonVoidFiltered = filtered.filter(d => d.status !== 'Void');
    const activeFiltered = filtered.filter(d => d.status === 'Active');
    const activeAndDraftFiltered = filtered.filter(d => d.status === 'Active' || d.status === 'Draft');
    setStats({
      totalContracts: nonVoidFiltered.length,
      totalValue: activeAndDraftFiltered.reduce((sum, d) => sum + Number(d.total_amount), 0),
      totalReceived: activeAndDraftFiltered.reduce((sum, d) => sum + Number(d.paid_amount || 0), 0),
      paymentsInPeriod,
      activeContracts: activeFiltered.length,
      closedContracts: filtered.filter(d => d.status === 'Closed').length,
    });
  };

  const clearDateFilter = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setServiceFilter("all");
    setStatusFilter("all");
    setCreatedByFilter("all");
  };

  const hasActiveFilters = searchQuery || dateFrom || dateTo || serviceFilter !== "all" || statusFilter !== "all" || createdByFilter !== "all";

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get unique user IDs to fetch their names
      const userIds = [...new Set((data || []).map(d => d.assigned_to).filter(Boolean))];
      
      let profilesMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        
        profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = p.full_name || '';
          return acc;
        }, {} as Record<string, string>);
      }

      // Map the data to include created_by_name
      const contractsWithCreator = (data || []).map((contract: any) => ({
        ...contract,
        created_by_name: contract.assigned_to ? profilesMap[contract.assigned_to] || null : null,
      }));

      setContracts(contractsWithCreator);
      setFilteredContracts(contractsWithCreator);

      // Calculate stats - Active + Draft contracts count towards Total Value and Received
      const activeContractsData = (data || []).filter(d => d.status === 'Active');
      const activeAndDraftData = (data || []).filter(d => d.status === 'Active' || d.status === 'Draft');
      const stats = {
        totalContracts: data?.length || 0,
        totalValue: activeAndDraftData.reduce((sum, d) => sum + Number(d.total_amount), 0),
        totalReceived: activeAndDraftData.reduce((sum, d) => sum + Number(d.paid_amount || 0), 0),
        paymentsInPeriod: 0,
        activeContracts: activeContractsData.length,
        closedContracts: (data || []).filter(d => d.status === 'Closed').length,
      };
      setStats(stats);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Draft: "bg-gray-500",
      Active: "bg-blue-500",
      Closed: "bg-green-500",
      Cancelled: "bg-red-500",
      Void: "bg-orange-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const exportToExcel = (useFiltered: boolean) => {
    const dataToExport = useFiltered ? filteredContracts : contracts;
    const exportData = dataToExport.map((c) => ({
      "Contract #": c.deal_number,
      "Client Name": c.client_name,
      "Phone": c.client_phone,
      "Service": c.service_type,
      "Worker": c.worker_name || "-",
      "Deal Date": c.deal_date ? format(new Date(c.deal_date), "dd MMM yyyy") : "-",
      "Deal Value": c.deal_value,
      "Total Amount": c.total_amount,
      "Received": c.paid_amount || 0,
      "Status": c.status,
      "Created By": c.created_by_name || "-",
      "Created At": format(new Date(c.created_at), "dd MMM yyyy"),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contracts");
    const fileName = useFiltered ? "contracts_filtered.xlsx" : "contracts_all.xlsx";
    XLSX.writeFile(wb, fileName);
    toast({ title: "Success", description: `Exported ${dataToExport.length} contracts to ${fileName}` });
  };

  const exportToPDF = async (useFiltered: boolean) => {
    const dataToExport = useFiltered ? filteredContracts : contracts;
    
    // Create a printable HTML table
    const printContent = `
      <html>
        <head>
          <title>Contracts Report</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 10px; margin: 20px; }
            h1 { font-size: 18px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #f4f4f4; font-weight: bold; }
            .text-right { text-align: right; }
            .summary { margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Contracts Report${useFiltered ? " (Filtered)" : ""}</h1>
          <p>Generated: ${format(new Date(), "dd MMM yyyy HH:mm")}</p>
          <table>
            <thead>
              <tr>
                <th>Contract #</th>
                <th>Client Name</th>
                <th>Phone</th>
                <th>Service</th>
                <th>Worker</th>
                <th>Deal Date</th>
                <th class="text-right">Value</th>
                <th class="text-right">Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${dataToExport.map(c => `
                <tr>
                  <td>${c.deal_number}</td>
                  <td>${c.client_name}</td>
                  <td>${c.client_phone}</td>
                  <td>${c.service_type}</td>
                  <td>${c.worker_name || "-"}</td>
                  <td>${c.deal_date ? format(new Date(c.deal_date), "dd MMM yyyy") : "-"}</td>
                  <td class="text-right">${Number(c.deal_value).toLocaleString()}</td>
                  <td class="text-right">${Number(c.total_amount).toLocaleString()}</td>
                  <td>${c.status}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="summary">
            <p><strong>Total Contracts:</strong> ${dataToExport.length}</p>
            <p><strong>Total Value:</strong> AED ${dataToExport.reduce((sum, c) => sum + Number(c.total_amount), 0).toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
    toast({ title: "Success", description: "PDF print dialog opened" });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading contracts...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">Contracts</h1>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportToExcel(false)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Excel (All)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToExcel(true)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Excel (Filtered)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToPDF(false)}>
                    <FileText className="w-4 h-4 mr-2" />
                    PDF (All)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToPDF(true)}>
                    <FileText className="w-4 h-4 mr-2" />
                    PDF (Filtered)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" onClick={() => navigate("/crm/contracts/ar-report")}>
                <BarChart3 className="w-4 h-4 mr-2" />
                A/R Report
              </Button>
              <Button onClick={() => navigate("/crm/contracts/create")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Contract
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
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
                <p className="text-2xl font-bold">AED {stats.totalValue.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Contract Received
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">AED {stats.totalReceived.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Based on deal date</p>
              </CardContent>
            </Card>

            {(dateFrom || dateTo) && (
              <Card className="border-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-primary">
                    <DollarSign className="w-4 h-4" />
                    Payments in Period
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">AED {stats.paymentsInPeriod.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Based on payment date</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Active / Closed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.activeContracts} / {stats.closedContracts}</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by client name, phone, contract number, or worker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Filters:</span>
              </div>

              {/* Service Type Filter */}
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {uniqueServices.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Created By Filter */}
              <Select value={createdByFilter} onValueChange={setCreatedByFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Created By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Creators</SelectItem>
                  {uniqueCreators.map((creator) => (
                    <SelectItem key={creator} value={creator}>
                      {creator}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Range */}
              <span className="text-sm text-muted-foreground ml-2">Deal Date:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-[130px] justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd MMM yy") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground">-</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-[130px] justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd MMM yy") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-destructive hover:text-destructive">
                  <X className="mr-1 h-4 w-4" />
                  Clear all
                </Button>
              )}
            </div>

            {/* Active Filter Summary */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="font-normal">
                  Showing {filteredContracts.length} of {contracts.length} contracts
                </Badge>
                {serviceFilter !== "all" && (
                  <Badge variant="outline">{serviceFilter}</Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge variant="outline">{statusFilter}</Badge>
                )}
                {createdByFilter !== "all" && (
                  <Badge variant="outline">By: {createdByFilter}</Badge>
                )}
                {(dateFrom || dateTo) && (
                  <Badge variant="outline">
                    {dateFrom ? format(dateFrom, "dd MMM") : "..."} - {dateTo ? format(dateTo, "dd MMM") : "..."}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Contracts Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>All Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Worker</TableHead>
                      <TableHead>Deal Date</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={13} className="text-center py-8">
                          {hasActiveFilters ? "No contracts match the current filters." : "No contracts found. Create your first contract!"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredContracts.map((contract) => (
                        <TableRow key={contract.id} className="text-sm">
                          <TableCell className="font-mono font-medium">
                            {contract.deal_number}
                          </TableCell>
                          <TableCell>{contract.client_name}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {contract.client_phone}
                          </TableCell>
                          <TableCell>{contract.service_type}</TableCell>
                          <TableCell>{contract.worker_name || "-"}</TableCell>
                          <TableCell className="text-xs">
                            {contract.deal_date 
                              ? format(new Date(contract.deal_date), "dd MMM yyyy") 
                              : contract.start_date 
                                ? format(new Date(contract.start_date), "dd MMM yyyy") 
                                : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(contract.deal_value).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {Number(contract.total_amount).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            {Number(contract.paid_amount || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("text-xs", getStatusColor(contract.status))}>
                              {contract.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {contract.created_by_name || "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(contract.created_at).toLocaleDateString('en-GB')}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/crm/contracts/${contract.id}`)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Results Count Footer */}
              <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="font-medium text-foreground">
                    {filteredContracts.length} {filteredContracts.length === 1 ? "contract" : "contracts"}
                  </span>
                  {hasActiveFilters && (
                    <span>(filtered from {contracts.length} total)</span>
                  )}
                </div>
                {hasActiveFilters && filteredContracts.length > 0 && (
                  <div className="flex items-center gap-4">
                    <span>
                      Total Value: <span className="font-medium text-foreground">AED {filteredContracts.reduce((sum, c) => sum + Number(c.total_amount), 0).toLocaleString()}</span>
                    </span>
                    <span>
                      Received: <span className="font-medium text-green-600">AED {filteredContracts.reduce((sum, c) => sum + Number(c.paid_amount || 0), 0).toLocaleString()}</span>
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ContractsManagement;