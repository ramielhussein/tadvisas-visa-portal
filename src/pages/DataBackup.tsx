import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Download, CheckCircle2, Loader2, ArrowLeft, HardDrive, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInquiryPackages } from "@/hooks/useCRMData";
import ExcelJS from "exceljs";

interface TableInfo {
  name: string;
  displayName: string;
  description: string;
  rowCount?: number;
}

export default function DataBackup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isLoading: checkingAdmin } = useAdminCheck();
  const [exporting, setExporting] = useState<string | null>(null);
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [leadPackageFilter, setLeadPackageFilter] = useState<string>("all");
  const [filteredLeadCount, setFilteredLeadCount] = useState<number | null>(null);
  const [loadingFilteredCount, setLoadingFilteredCount] = useState(false);
  const { data: packages } = useInquiryPackages();

  const tables: TableInfo[] = [
    { name: "leads", displayName: "Leads", description: "Customer leads and contacts" },
    { name: "deals", displayName: "Deals", description: "Sales deals and transactions" },
    { name: "workers", displayName: "Workers", description: "Domestic worker profiles and CVs" },
    { name: "employees", displayName: "Admin Staff", description: "Internal admin staff records" },
    { name: "contracts", displayName: "Contracts", description: "Client contracts" },
    { name: "invoices", displayName: "Invoices", description: "Customer invoices" },
    { name: "payments", displayName: "Payments", description: "Payment records" },
    { name: "transactions", displayName: "Transactions", description: "Financial transactions" },
    { name: "suppliers", displayName: "Suppliers", description: "Supplier information" },
    { name: "supplier_invoices", displayName: "Supplier Invoices", description: "Supplier bills" },
    { name: "purchase_orders", displayName: "Purchase Orders", description: "Worker procurement orders" },
    { name: "bank_accounts", displayName: "Bank Accounts", description: "Bank account information" },
    { name: "equity_accounts", displayName: "Equity Accounts", description: "Owner equity accounts" },
    { name: "refunds", displayName: "Refunds", description: "Client refund records" },
    { name: "submissions", displayName: "Submissions", description: "Client form submissions" },
    { name: "lead_activities", displayName: "Lead Activities", description: "Lead interaction history" },
    { name: "lead_sources", displayName: "Lead Sources", description: "Lead source configuration" },
    { name: "inquiry_packages", displayName: "Inquiry Packages", description: "Service packages" },
    { name: "products", displayName: "Products", description: "Product catalog" },
    { name: "sales_targets", displayName: "Sales Targets", description: "Sales team targets" },
    { name: "delivery_orders", displayName: "Delivery Orders", description: "Worker delivery records" },
    { name: "receipt_orders", displayName: "Receipt Orders", description: "Worker receipt records" },
    { name: "worker_transfers", displayName: "Worker Transfers", description: "Worker movement records" },
    { name: "worker_returns", displayName: "Worker Returns", description: "Worker return records" },
    { name: "nationality_workflows", displayName: "Nationality Workflows", description: "Visa workflows by nationality" },
    { name: "daily_headcount", displayName: "Daily Headcount", description: "Daily worker count records" },
    { name: "profiles", displayName: "User Profiles", description: "User profile information" },
    { name: "user_roles", displayName: "User Roles", description: "User role assignments" },
    { name: "notifications", displayName: "Notifications", description: "System notifications" },
    { name: "chat_messages", displayName: "Chat Messages", description: "Team chat messages" },
    { name: "audit_logs", displayName: "Audit Logs", description: "System audit trail" },
  ];

  // Load total database size on mount
  useEffect(() => {
    loadTableCounts();
  }, []);

  // Calculate total records whenever tableCounts changes
  useEffect(() => {
    const total = Object.values(tableCounts).reduce((sum, count) => sum + count, 0);
    setTotalRecords(total);
  }, [tableCounts]);

  // Load filtered lead count when package filter changes
  useEffect(() => {
    const loadFilteredCount = async () => {
      if (leadPackageFilter === "all") {
        setFilteredLeadCount(null);
        return;
      }
      
      setLoadingFilteredCount(true);
      try {
        const { count, error } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("service_required", leadPackageFilter);
        
        if (!error && count !== null) {
          setFilteredLeadCount(count);
        }
      } catch (error) {
        console.error("Error counting filtered leads:", error);
      } finally {
        setLoadingFilteredCount(false);
      }
    };
    
    loadFilteredCount();
  }, [leadPackageFilter]);

  const loadTableCounts = async () => {
    setLoadingCounts(true);
    const counts: Record<string, number> = {};

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table.name as any)
          .select("*", { count: "exact", head: true });

        if (!error && count !== null) {
          counts[table.name] = count;
        }
      } catch (error) {
        console.error(`Error counting ${table.name}:`, error);
      }
    }

    setTableCounts(counts);
    setLoadingCounts(false);
  };

  // Helper function to fetch all rows using pagination (bypasses 1000 row limit)
  const fetchAllRows = async (tableName: string, filter?: { column: string; value: string }) => {
    const allData: any[] = [];
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from(tableName as any)
        .select("*")
        .range(from, from + pageSize - 1);
      
      // Apply filter if provided
      if (filter && filter.value !== "all") {
        query = query.eq(filter.column, filter.value);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        allData.push(...data);
        from += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    return allData;
  };

  const exportTable = async (tableName: string, displayName: string, filter?: { column: string; value: string }) => {
    setExporting(tableName);

    try {
      // Use pagination to fetch ALL records
      const data = await fetchAllRows(tableName, filter);

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(displayName.substring(0, 31));
      const rows = data || [];
      if (rows.length > 0) {
        worksheet.columns = Object.keys(rows[0]).map(key => ({ header: key, key }));
        rows.forEach(row => worksheet.addRow(row));
      }
      
      // Generate Excel file
      const timestamp = new Date().toISOString().split("T")[0];
      const filterSuffix = filter && filter.value !== "all" ? `_${filter.value}` : "";
      const filename = `${tableName}${filterSuffix}_backup_${timestamp}.xlsx`;
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `${displayName} exported successfully (${data.length} records)`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  const exportFilteredLeads = async () => {
    await exportTable("leads", `Leads (${leadPackageFilter === "all" ? "All" : leadPackageFilter})`, 
      leadPackageFilter !== "all" ? { column: "service_required", value: leadPackageFilter } : undefined
    );
  };

  const exportAllTables = async () => {
    setExporting("all");

    try {
      const workbook = new ExcelJS.Workbook();
      let totalRecordsExported = 0;
      let tablesExported = 0;

      for (const table of tables) {
        try {
          const data = await fetchAllRows(table.name);

          if (data && data.length > 0) {
            const sheetName = table.displayName.substring(0, 31);
            const worksheet = workbook.addWorksheet(sheetName);
            worksheet.columns = Object.keys(data[0]).map(key => ({ header: key, key }));
            data.forEach(row => worksheet.addRow(row));
            totalRecordsExported += data.length;
            tablesExported++;
          }
        } catch (error) {
          console.error(`Error exporting ${table.name}:`, error);
          continue;
        }
      }

      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `complete_database_backup_${timestamp}.xlsx`;
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Complete Backup Exported",
        description: `All ${tablesExported} tables exported with ${totalRecordsExported} total records`,
      });
    } catch (error: any) {
      toast({
        title: "Backup Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  if (checkingAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You need admin privileges to access this page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/")}>Go Home</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Hub
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-primary/10">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Data Backup & Export
                </h1>
                <p className="text-muted-foreground text-lg">
                  Download local copies of your database tables
                </p>
              </div>
            </div>
          </div>

          {/* Total Database Size Card - Always Visible */}
          <Card className="mb-6 border-2 border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="py-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/20">
                      <Database className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Total Database Size</p>
                      <p className="text-4xl font-bold text-primary">
                        {loadingCounts ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="text-lg">Calculating...</span>
                          </span>
                        ) : (
                          totalRecords.toLocaleString()
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">records across {tables.length} tables</p>
                    </div>
                  </div>
                  
                  {/* Leads Count */}
                  <div className="border-l-2 border-primary/30 pl-6">
                    <p className="text-sm text-muted-foreground font-medium">Total Leads</p>
                    <p className="text-3xl font-bold text-orange-500">
                      {loadingCounts ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        (tableCounts["leads"] || 0).toLocaleString()
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">lead records</p>
                  </div>
                </div>
                <Button
                  onClick={loadTableCounts}
                  disabled={loadingCounts}
                  variant="outline"
                  size="sm"
                >
                  {loadingCounts ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <HardDrive className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Backup Information</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>Automatic Backups:</strong> Lovable Cloud creates daily backups (retained for 7 days)</li>
                    <li>• <strong>Manual Exports:</strong> Download tables as JSON for local archiving and auditing</li>
                    <li>• <strong>Data Integrity:</strong> All exports include timestamps and row counts</li>
                    <li>• <strong>Storage:</strong> Save exports to multiple locations for redundancy</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtered Leads Export */}
          <Card className="mb-6 border-orange-500/20 bg-orange-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-orange-500" />
                Export Leads by Package
              </CardTitle>
              <CardDescription>
                Filter and download leads by service package (P1, P2, P3, P4, P5, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={leadPackageFilter} onValueChange={setLeadPackageFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Packages</SelectItem>
                    {packages?.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.package_name}>
                        {pkg.package_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={exportFilteredLeads}
                  disabled={exporting !== null}
                  className="flex-1 sm:flex-none"
                >
                  {exporting === "leads" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export {leadPackageFilter === "all" ? "All Leads" : `${leadPackageFilter} Leads`}
                    </>
                  )}
                </Button>
                <div className="flex items-center text-sm text-muted-foreground">
                  {loadingFilteredCount ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : leadPackageFilter === "all" ? (
                    <>Total leads: <span className="font-semibold ml-1">{(tableCounts["leads"] || 0).toLocaleString()}</span></>
                  ) : (
                    <>
                      <span className="font-semibold text-orange-500">{(filteredLeadCount || 0).toLocaleString()}</span>
                      <span className="mx-1">{leadPackageFilter} leads</span>
                      <span className="text-xs">(of {(tableCounts["leads"] || 0).toLocaleString()} total)</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export All Button */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Complete Database Export
              </CardTitle>
              <CardDescription>
                Download all tables in a single comprehensive backup file
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button
                onClick={exportAllTables}
                disabled={exporting !== null}
                size="lg"
                className="flex-1"
              >
                {exporting === "all" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting All Tables...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export All Tables
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Individual Tables */}
          <Card>
            <CardHeader>
              <CardTitle>Export Individual Tables</CardTitle>
              <CardDescription>
                Download specific tables as JSON files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tables.map((table) => (
                  <Button
                    key={table.name}
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-start gap-2 hover:bg-accent"
                    onClick={() => exportTable(table.name, table.displayName)}
                    disabled={exporting !== null}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {exporting === table.name ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-semibold text-left flex-1">
                        {table.displayName}
                      </span>
                      {tableCounts[table.name] !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {tableCounts[table.name].toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground text-left w-full">
                      {table.description}
                    </p>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Footer Note */}
          <Card className="mt-6 bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Exports are in JSON format and include all columns and data. 
                Files are named with today's date. Store backups securely in multiple locations for maximum safety.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
