import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import Layout from "@/components/Layout";
import { Search, Plus, FileText, DollarSign, TrendingUp, Clock, BarChart3, CalendarIcon, X, Download } from "lucide-react";
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
  const [stats, setStats] = useState({
    totalContracts: 0,
    totalValue: 0,
    totalReceived: 0,
    activeContracts: 0,
    closedContracts: 0,
  });

  useEffect(() => {
    fetchContracts();
  }, []);

  useEffect(() => {
    filterContracts();
  }, [searchQuery, contracts, dateFrom, dateTo]);

  const filterContracts = () => {
    let filtered = contracts;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (contract) =>
          contract.client_name.toLowerCase().includes(query) ||
          contract.client_phone.includes(query) ||
          contract.deal_number.toLowerCase().includes(query)
      );
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

    // Update stats based on filtered data - exclude Void contracts from count
    const nonVoidFiltered = filtered.filter(d => d.status !== 'Void');
    const activeFiltered = filtered.filter(d => d.status === 'Active');
    const activeAndDraftFiltered = filtered.filter(d => d.status === 'Active' || d.status === 'Draft');
    setStats({
      totalContracts: nonVoidFiltered.length,
      totalValue: activeAndDraftFiltered.reduce((sum, d) => sum + Number(d.total_amount), 0),
      totalReceived: activeAndDraftFiltered.reduce((sum, d) => sum + Number(d.paid_amount || 0), 0),
      activeContracts: activeFiltered.length,
      closedContracts: filtered.filter(d => d.status === 'Closed').length,
    });
  };

  const clearDateFilter = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
                  Received
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">AED {stats.totalReceived.toLocaleString()}</p>
              </CardContent>
            </Card>

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

          {/* Search and Date Filter */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by client name, phone, or contract number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Date Range Filter */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Deal Date:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd MMM yyyy") : "From date"}
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

              <span className="text-muted-foreground">to</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd MMM yyyy") : "To date"}
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

              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={clearDateFilter}>
                  <X className="mr-1 h-4 w-4" />
                  Clear dates
                </Button>
              )}
            </div>
          </div>

          {/* Contracts Table */}
          <Card>
            <CardHeader>
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
                          No contracts found. Create your first contract!
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
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ContractsManagement;