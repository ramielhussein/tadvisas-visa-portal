import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Search, Plus, Download, Upload, ArrowUpDown, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import Layout from "@/components/Layout";
import QuickLeadEntry from "@/components/crm/QuickLeadEntry";
import RoundRobinToggle from "@/components/crm/RoundRobinToggle";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface Lead {
  id: string;
  client_name: string;
  email: string | null;
  mobile_number: string;
  emirate: string | null;
  status: string;
  service_required: string | null;
  nationality_code: string | null;
  lead_source: string | null;
  remind_me: string;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  client_converted: boolean;
  submission_id: string | null;
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

const LeadManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminCheckLoading } = useAdminCheck();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [sortColumn, setSortColumn] = useState<'nationality_code' | 'service_required' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    "New Lead": 0,
    "Warm": 0,
    "HOT": 0,
    "SOLD": 0,
    "LOST": 0,
  });

  // Calculate status distribution for pie chart
  const statusDistribution = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    filteredLeads.forEach(lead => {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
    });

    const colors: Record<string, string> = {
      "New Lead": "#3b82f6",
      "Called No Answer": "#f59e0b",
      "Called Engaged": "#10b981",
      "Called COLD": "#6366f1",
      "Called Unanswer 2": "#f97316",
      "No Connection": "#6b7280",
      "Warm": "#fbbf24",
      "HOT": "#ef4444",
      "SOLD": "#22c55e",
      "LOST": "#dc2626",
      "PROBLEM": "#991b1b",
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      percentage: ((count / filteredLeads.length) * 100).toFixed(1),
      color: colors[status] || "#94a3b8",
    }));
  }, [filteredLeads]);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      setAuthChecking(false);
      
      if (!session?.user) {
        navigate("/auth");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
      
      if (!session?.user && event !== 'INITIAL_SESSION') {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (currentUser && !authChecking) {
      fetchLeads();
      fetchUsers();
    }
  }, [currentUser, authChecking, isAdmin]);

  useEffect(() => {
    // Keyboard shortcut Ctrl+Shift+Q (changed from L)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
        e.preventDefault();
        setShowQuickEntry(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    let filtered = leads;
    
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = leads.filter(
        (lead) =>
          (lead.mobile_number?.toLowerCase?.().includes(query) ?? false) ||
          ((lead.client_name || "").toLowerCase().includes(query)) ||
          ((lead.email || "").toLowerCase().includes(query))
      );
    }

    // Apply custom sorting if column sort is active
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn] || "";
        const bVal = b[sortColumn] || "";
        
        if (sortDirection === 'asc') {
          return aVal.localeCompare(bVal);
        } else {
          return bVal.localeCompare(aVal);
        }
      });
    } else {
      // Apply default sorting: LOST at bottom, remind_me priority, then updated_at
      filtered = [...filtered].sort((a, b) => {
        // First priority: LOST status goes to bottom
        if (a.status === "LOST" && b.status !== "LOST") return 1;
        if (a.status !== "LOST" && b.status === "LOST") return -1;
        
        // Second priority: Sort by remind_me (ascending) - sooner reminders first
        const remindA = a.remind_me ? new Date(a.remind_me).getTime() : Infinity;
        const remindB = b.remind_me ? new Date(b.remind_me).getTime() : Infinity;
        if (remindA !== remindB) return remindA - remindB;
        
        // Third priority: Sort by updated_at (descending) - recently pinged/updated first
        const dateA = new Date(a.updated_at).getTime();
        const dateB = new Date(b.updated_at).getTime();
        return dateB - dateA;
      });
    }

    setFilteredLeads(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchQuery, leads, sortColumn, sortDirection]);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      
      // Build query based on user role
      let query = supabase.from("leads").select("*", { count: 'exact' });
      
      // If not admin, only show leads assigned to current user
      if (!isAdmin && currentUser) {
        query = query.eq("assigned_to", currentUser.id);
      }
      
      // Remove default 1000 row limit by setting a high range
      // Sort by remind_me asc (sooner dates first), then updated_at desc
      const { data, count, error } = await query
        .order("remind_me", { ascending: true, nullsFirst: false })
        .order("updated_at", { ascending: false })
        .range(0, 99999);

      if (error) throw error;
      
      // Additional client-side sorting to ensure LOST leads are at the bottom
      const sortedData = (data || []).sort((a, b) => {
        // First priority: LOST status goes to bottom
        if (a.status === "LOST" && b.status !== "LOST") return 1;
        if (a.status !== "LOST" && b.status === "LOST") return -1;
        
        // Second priority: Sort by remind_me (ascending) - sooner reminders first
        const remindA = a.remind_me ? new Date(a.remind_me).getTime() : Infinity;
        const remindB = b.remind_me ? new Date(b.remind_me).getTime() : Infinity;
        if (remindA !== remindB) return remindA - remindB;
        
        // Third priority: Sort by updated_at (descending) - recently pinged/updated first
        const dateA = new Date(a.updated_at).getTime();
        const dateB = new Date(b.updated_at).getTime();
        return dateB - dateA;
      });
      
      setLeads(sortedData);
      setFilteredLeads(sortedData);
      setTotalCount(count ?? 0);

      // Fetch counts for each status
      const statuses: Array<"New Lead" | "Called No Answer" | "Called Engaged" | "Called COLD" | "Called Unanswer 2" | "No Connection" | "Warm" | "HOT" | "SOLD" | "LOST" | "PROBLEM"> = ["New Lead", "Called No Answer", "Called Engaged", "Called COLD", "Called Unanswer 2", "No Connection", "Warm", "HOT", "SOLD", "LOST", "PROBLEM"];
      const statusCountsPromises = statuses.map(
        async (status) => {
          const { count } = await supabase
            .from("leads")
            .select("*", { count: "exact", head: true })
            .eq("status", status);
          return { status, count: count ?? 0 };
        }
      );

      const statusCountsResults = await Promise.all(statusCountsPromises);
      const newStatusCounts = statusCountsResults.reduce(
        (acc, { status, count }) => ({ ...acc, [status]: count }),
        {} as Record<string, number>
      );
      setStatusCounts(newStatusCounts);
    } catch (error: any) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, permissions")
        .order("email");

      if (profilesError) throw profilesError;

      // Filter for users with sales/deals permissions or lead assignment permissions
      const salesUsers = (profilesData || []).filter((user: any) => {
        const permissions = user.permissions as any;
        return (
          permissions?.leads?.assign === true ||
          permissions?.deals?.create === true ||
          permissions?.deals?.edit === true
        );
      });

      setUsers(salesUsers);
    } catch (error: any) {
      console.error("Error fetching users:", error);
    }
  };

  const handleAssignLead = async (leadId: string, userId: string | null) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ assigned_to: userId })
        .eq("id", leadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead assignment updated",
      });

      fetchLeads();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    // Validate status - SOLD cannot be manually selected
    const validStatuses: Array<"New Lead" | "Called No Answer" | "Called Engaged" | "Called COLD" | "Called Unanswer 2" | "No Connection" | "Warm" | "HOT" | "LOST" | "PROBLEM"> = ["New Lead", "Called No Answer", "Called Engaged", "Called COLD", "Called Unanswer 2", "No Connection", "Warm", "HOT", "LOST", "PROBLEM"];
    if (!validStatuses.includes(newStatus as any)) {
      toast({
        title: "Error",
        description: "Invalid status selection",
        variant: "destructive",
      });
      return;
    }

    try {
      const updateData: any = { 
        status: newStatus as "New Lead" | "Called No Answer" | "Called Engaged" | "Called COLD" | "Called Unanswer 2" | "No Connection" | "Warm" | "HOT" | "LOST" | "PROBLEM" | "SOLD"
      };

      // Set reminder based on status
      if (newStatus === "Called No Answer" || newStatus === "Called Unanswer 2") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        updateData.remind_me = tomorrow.toISOString().split('T')[0];
      } else if (newStatus === "LOST") {
        const twoYears = new Date();
        twoYears.setFullYear(twoYears.getFullYear() + 2);
        updateData.remind_me = twoYears.toISOString().split('T')[0];
      }

      // Handle "No Connection" - reassign to next person in round-robin
      if (newStatus === "No Connection") {
        try {
          // Get current lead to find current assignee
          const { data: currentLead } = await supabase
            .from("leads")
            .select("assigned_to")
            .eq("id", leadId)
            .single();

          // Call round-robin assignment
          const { data: rrData, error: rrError } = await supabase.functions.invoke("assign-lead-round-robin", {
            body: { leadId },
          });

          if (rrError) {
            console.error("Round-robin reassignment failed:", rrError);
          } else {
            console.log("Lead reassigned via round-robin:", rrData);
          }
        } catch (rrError) {
          console.error("Exception during round-robin reassignment:", rrError);
        }
      }

      const { error } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", leadId);

      if (error) throw error;

      let description = `Lead status updated to ${newStatus}`;
      if (newStatus === "Called No Answer" || newStatus === "Called Unanswer 2") {
        description += " and reminder set to tomorrow";
      } else if (newStatus === "LOST") {
        description += " and reminder set to 2 years from now";
      } else if (newStatus === "No Connection") {
        description += " and reassigned to next salesperson";
      }

      toast({
        title: "Success",
        description,
      });

      fetchLeads();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReminderDaysChange = async (leadId: string, days: number) => {
    if (days < 1 || days > 3650) {
      toast({
        title: "Invalid Input",
        description: "Days must be between 1 and 3650",
        variant: "destructive",
      });
      return;
    }

    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      const { error } = await supabase
        .from("leads")
        .update({ remind_me: futureDate.toISOString().split('T')[0] })
        .eq("id", leadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Reminder set to ${days} day${days !== 1 ? 's' : ''} from now`,
      });

      fetchLeads();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getAssignedEmail = (userId: string | null) => {
    if (!userId) return "Unassigned";
    const user = users.find(u => u.id === userId);
    return user?.full_name || user?.email || "Unknown";
  };

  const handleSort = (column: 'nationality_code' | 'service_required') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "New Lead": "bg-blue-500 text-white hover:bg-blue-600",
      "Called Engaged": "bg-blue-500 text-white hover:bg-blue-600",
      "Called No Answer": "bg-pink-600 text-white hover:bg-pink-700",
      "Called COLD": "bg-red-600 text-white hover:bg-red-700",
      "Called Unanswer 2": "bg-pink-700 text-white hover:bg-pink-800",
      "No Connection": "bg-gray-700 text-white hover:bg-gray-800",
      "Warm": "bg-red-400 text-white hover:bg-red-500",
      "HOT": "bg-orange-600 text-white hover:bg-orange-700",
      "SOLD": "bg-green-600 text-white hover:bg-green-700",
      "LOST": "bg-red-700 text-white hover:bg-red-800",
      "PROBLEM": "bg-black text-white hover:bg-gray-900",
    };
    return colors[status] || "bg-gray-500 text-white";
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('import-leads-excel', {
        body: formData,
      });

      if (error) throw error;

      const result = data as {
        total: number;
        imported: number;
        duplicates: number;
        errors: number;
        duplicateNumbers: string[];
        errorDetails: Array<{ row: number; error: string }>;
      };

      toast({
        title: "Import Complete",
        description: `Imported ${result.imported} leads. Skipped ${result.duplicates} duplicates. ${result.errors} errors.`,
      });

      // Show detailed results if there are issues
      if (result.duplicates > 0 || result.errors > 0) {
        console.log('Import details:', {
          duplicates: result.duplicateNumbers,
          errors: result.errorDetails,
        });
      }

      // Refresh the leads list
      fetchLeads();
    } catch (error: any) {
      console.error("Error importing Excel:", error);
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleImportGoogle = () => {
    toast({
      title: "Coming Soon",
      description: "Google Sheets import functionality will be available soon!",
    });
  };

  if (authChecking || isLoading || adminCheckLoading) {
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

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold">
                {isAdmin ? "TADCRM - Lead Management" : "My Assigned Leads"}
              </h1>
              {!isAdmin && (
                <p className="text-sm text-muted-foreground mt-2">
                  Viewing leads assigned to you
                </p>
              )}
            </div>
            <Button variant="outline" onClick={() => navigate("/crm/dashboard")}>
              View Dashboard
            </Button>
          </div>
          <div className="mb-4"></div>
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <div className="flex gap-2">
              {isAdmin && (
                <>
                  <Button onClick={handleImportGoogle} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Import Google Sheets
                  </Button>
                  <Button variant="outline" asChild>
                    <label className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Import Excel
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleImportExcel}
                        className="hidden"
                      />
                    </label>
                  </Button>
                </>
              )}
              {/* All authenticated users can create leads */}
              <Button onClick={() => setShowQuickEntry(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Lead (Ctrl+Shift+Q)
              </Button>
            </div>
          </div>

          {/* Round Robin Toggle and Status Chart - Admin only */}
          {isAdmin && (
            <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RoundRobinToggle />
              <Card>
                <CardHeader>
                  <CardTitle>Lead Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredLeads.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name}: ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value} leads`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      No leads to display
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalCount}</p>
              </CardContent>
            </Card>
            {["New Lead", "Warm", "HOT", "SOLD", "LOST"].map((status) => (
              <Card key={status}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{status}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {statusCounts[status] || 0}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search and Pagination Info */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by phone number, name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredLeads.length)} of {filteredLeads.length}
            </div>
          </div>

          {/* Leads Table */}
          <Card>
            <CardHeader>
              <CardTitle>{isAdmin ? "All Leads" : "My Leads"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Name</TableHead>
                      <TableHead className="min-w-[110px]">Mobile</TableHead>
                      <TableHead className="hidden lg:table-cell">Email</TableHead>
                      <TableHead className="hidden md:table-cell">Emirate</TableHead>
                      <TableHead className="min-w-[60px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('nationality_code')}
                          className="h-8 px-1 hover:bg-accent"
                        >
                          Nat.
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="hidden xl:table-cell">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('service_required')}
                          className="h-8 px-1 hover:bg-accent"
                        >
                          Service
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                      {isAdmin && <TableHead className="min-w-[140px]">Assigned</TableHead>}
                      <TableHead className="hidden md:table-cell min-w-[90px]">Remind</TableHead>
                      <TableHead className="min-w-[100px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8">
                          No leads found. Add your first lead!
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedLeads.map((lead) => (
                        <TableRow key={lead.id} className="text-sm">
                          <TableCell className="font-medium">
                            <button
                              onClick={() => navigate(`/crm/leads/${lead.id}`)}
                              className="hover:text-primary hover:underline text-left"
                            >
                              {lead.client_name || "-"}
                            </button>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{lead.mobile_number}</TableCell>
                          <TableCell className="hidden lg:table-cell truncate max-w-[150px]">{lead.email || "-"}</TableCell>
                          <TableCell className="hidden md:table-cell">{lead.emirate || "-"}</TableCell>
                          <TableCell>{lead.nationality_code || "-"}</TableCell>
                          <TableCell className="hidden xl:table-cell truncate max-w-[120px]">{lead.service_required || "-"}</TableCell>
                          <TableCell>
                            <Select
                              value={lead.status}
                              onValueChange={(value) => handleStatusChange(lead.id, value)}
                              disabled={lead.status === "SOLD"}
                            >
                              <SelectTrigger className={cn("w-[110px] h-8 text-xs border-none", getStatusColor(lead.status))}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="New Lead">New Lead</SelectItem>
                                <SelectItem value="Called No Answer">Called No Answer</SelectItem>
                                <SelectItem value="Called Engaged">Called Engaged</SelectItem>
                                <SelectItem value="Called COLD">Called COLD</SelectItem>
                                <SelectItem value="Called Unanswer 2">Called Unanswer 2</SelectItem>
                                <SelectItem value="No Connection">No Connection</SelectItem>
                                <SelectItem value="Warm">Warm</SelectItem>
                                <SelectItem value="HOT">HOT</SelectItem>
                                <SelectItem value="LOST">LOST</SelectItem>
                                <SelectItem value="PROBLEM">PROBLEM</SelectItem>
                                {lead.status === "SOLD" && (
                                  <SelectItem value="SOLD" disabled>SOLD (Auto-set)</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          {isAdmin && (
                            <TableCell>
                              <Select
                                value={lead.assigned_to || "unassigned"}
                                onValueChange={(value) =>
                                  handleAssignLead(
                                    lead.id,
                                    value === "unassigned" ? null : value
                                  )
                                }
                              >
                                <SelectTrigger className="w-[130px] h-8 text-xs">
                                  <SelectValue placeholder="Unassigned" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">
                                    Unassigned
                                  </SelectItem>
                                  {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.full_name || user.email.split('@')[0]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          )}
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-1">
                              <span className="text-xs">
                                {new Date(lead.remind_me).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              </span>
                              <Input
                                type="number"
                                min="1"
                                max="3650"
                                placeholder="Days"
                                className="w-14 h-7 text-xs px-1"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const value = parseInt(e.currentTarget.value);
                                    if (!isNaN(value) && value > 0) {
                                      handleReminderDaysChange(lead.id, value);
                                      e.currentTarget.value = '';
                                    }
                                  }
                                }}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => setEditingLead(lead)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              {lead.client_converted ? (
                                <Badge variant="outline" className="bg-green-50 text-xs whitespace-nowrap">
                                  ✓ Client
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2"
                                  onClick={() => navigate(`/start-here?lead_id=${lead.id}`)}
                                >
                                  Convert
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Card className="mt-4">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <QuickLeadEntry
        open={showQuickEntry || !!editingLead}
        onClose={() => {
          setShowQuickEntry(false);
          setEditingLead(null);
        }}
        onSuccess={fetchLeads}
        lead={editingLead}
      />
    </Layout>
  );
};

export default LeadManagement;
