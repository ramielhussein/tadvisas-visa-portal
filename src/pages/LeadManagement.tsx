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
import { Search, Plus, Download, Upload, ArrowUpDown, ChevronLeft, ChevronRight, Pencil, Anchor, XCircle, Flame } from "lucide-react";
import Layout from "@/components/Layout";
import QuickLeadEntry from "@/components/crm/QuickLeadEntry";
import RoundRobinToggle from "@/components/crm/RoundRobinToggle";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

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
  hot: boolean | null;
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

  // Split leads into categories - no filtering yet
  const newIncomingLeads = useMemo(() => {
    return leads
      .filter(lead => lead.status === "New Lead" && !lead.assigned_to)
      .sort((a, b) => {
        // Sort newest to oldest
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });
  }, [leads]);

  const myLeads = useMemo(() => {
    if (!currentUser) return [];
    return leads
      .filter(lead => lead.assigned_to === currentUser.id)
      .sort((a, b) => {
        // Leads with NO reminder date appear on top
        const hasRemindA = !!a.remind_me;
        const hasRemindB = !!b.remind_me;
        
        if (!hasRemindA && hasRemindB) return -1;
        if (hasRemindA && !hasRemindB) return 1;
        
        // Both have reminders - sort by reminder date (soonest first)
        if (hasRemindA && hasRemindB) {
          const remindA = new Date(a.remind_me!).getTime();
          const remindB = new Date(b.remind_me!).getTime();
          return remindA - remindB;
        }
        
        // Both have no reminder - sort by newest first
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });
  }, [leads, currentUser]);

  // Apply search filtering to each category
  useEffect(() => {
    const filterLeads = (leadsArray: Lead[]) => {
      if (!searchQuery.trim()) return leadsArray;
      const query = searchQuery.toLowerCase();
      return leadsArray.filter(lead =>
        (lead.mobile_number?.toLowerCase?.().includes(query) ?? false) ||
        ((lead.client_name || "").toLowerCase().includes(query)) ||
        ((lead.email || "").toLowerCase().includes(query)) ||
        ((lead.nationality_code || "").toLowerCase().includes(query)) ||
        ((lead.service_required || "").toLowerCase().includes(query))
      );
    };

    // For display purposes, combine both categories if admin or just myLeads for users
    const combinedFiltered = isAdmin 
      ? [...filterLeads(newIncomingLeads), ...filterLeads(myLeads)]
      : filterLeads(myLeads);

    setFilteredLeads(combinedFiltered);
    setCurrentPage(1);
  }, [searchQuery, newIncomingLeads, myLeads, isAdmin]);

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
        
        // Third priority: Sort by created_at (descending) - newest leads first
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
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

  const handleClaimLead = async (leadId: string) => {
    if (!currentUser) return;
    
    // Optimistic update - update UI immediately
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === leadId 
          ? { ...lead, assigned_to: currentUser.id }
          : lead
      )
    );
    
    try {
      const { error } = await supabase
        .from('leads')
        .update({ assigned_to: currentUser.id })
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead claimed successfully!",
      });
    } catch (error: any) {
      console.error('Error claiming lead:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to claim lead",
        variant: "destructive",
      });
      // Revert on error
      fetchLeads();
    }
  };

  const handleUnassignLead = async (leadId: string) => {
    // Optimistic update - update UI immediately
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === leadId 
          ? { ...lead, assigned_to: null, status: "New Lead" as const }
          : lead
      )
    );
    
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          assigned_to: null,
          status: "New Lead"
        })
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead returned to unassigned pool",
      });
    } catch (error: any) {
      console.error('Error unassigning lead:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to unassign lead",
        variant: "destructive",
      });
      // Revert on error
      fetchLeads();
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
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={statusDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={100}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => `${value} leads`}
                          labelFormatter={(label) => `Status: ${label}`}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
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

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by phone number, name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Two-Pane Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* New Incoming Leads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  New Incoming Leads ({newIncomingLeads.filter(lead => 
                    !searchQuery || 
                    lead.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    lead.mobile_number?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-y-auto max-h-[600px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newIncomingLeads
                        .filter(lead => 
                          !searchQuery || 
                          lead.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lead.mobile_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No new leads
                          </TableCell>
                        </TableRow>
                      ) : (
                        newIncomingLeads
                          .filter(lead => 
                            !searchQuery || 
                            lead.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            lead.mobile_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((lead) => (
                              <TableRow key={lead.id} className="hover:bg-muted/50 transition-all duration-300 animate-fade-in">
                                <TableCell>
                                  <div>
                                    <div className="font-medium flex items-center gap-2">
                                      {lead.hot && <Flame className="h-4 w-4 text-orange-500" />}
                                      <span
                                        onClick={() => navigate(`/crm/leads/${lead.id}`)}
                                        className="cursor-pointer hover:text-primary hover:underline"
                                      >
                                        {lead.client_name}
                                      </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">{lead.mobile_number}</div>
                                  </div>
                                </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>{lead.service_required || '-'}</div>
                                  <div className="text-muted-foreground">{lead.nationality_code || '-'}</div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(lead.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleClaimLead(lead.id)}
                                  title="Claim this lead"
                                  className="hover:text-primary"
                                >
                                  <Anchor className="h-4 w-4" />
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

            {/* My Leads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pencil className="h-5 w-5" />
                  My Leads ({myLeads.filter(lead => 
                    !searchQuery || 
                    lead.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    lead.mobile_number?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-y-auto max-h-[600px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reminder</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myLeads
                        .filter(lead => 
                          !searchQuery || 
                          lead.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lead.mobile_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No assigned leads
                          </TableCell>
                        </TableRow>
                      ) : (
                        myLeads
                          .filter(lead => 
                            !searchQuery || 
                            lead.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            lead.mobile_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((lead) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const reminderDate = lead.remind_me ? new Date(lead.remind_me) : null;
                            const isOverdue = reminderDate && reminderDate < today;
                            const isDueToday = reminderDate && reminderDate.getTime() === today.getTime();

                            return (
                              <TableRow key={lead.id} className="hover:bg-muted/50 transition-all duration-300 animate-fade-in">
                                <TableCell>
                                  <div>
                                    <div className="font-medium flex items-center gap-2">
                                      {lead.hot && <Flame className="h-4 w-4 text-orange-500" />}
                                      <button
                                        onClick={() => navigate(`/crm/leads/${lead.id}`)}
                                        className="hover:text-primary hover:underline text-left"
                                      >
                                        {lead.client_name}
                                      </button>
                                    </div>
                                    <div className="text-sm text-muted-foreground">{lead.mobile_number}</div>
                                  </div>
                                </TableCell>
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
                                      <SelectItem value="Called No Answer">No Answer</SelectItem>
                                      <SelectItem value="Called Engaged">Engaged</SelectItem>
                                      <SelectItem value="Called COLD">COLD</SelectItem>
                                      <SelectItem value="Warm">Warm</SelectItem>
                                      <SelectItem value="HOT">HOT</SelectItem>
                                      <SelectItem value="No Connection">No Connection</SelectItem>
                                      <SelectItem value="LOST">LOST</SelectItem>
                                      <SelectItem value="PROBLEM">PROBLEM</SelectItem>
                                      {lead.status === "SOLD" && (
                                        <SelectItem value="SOLD" disabled>SOLD</SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  {!lead.remind_me ? (
                                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">No reminder</Badge>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                        "text-xs",
                                        isOverdue && "text-destructive font-bold",
                                        isDueToday && "text-orange-600 font-bold"
                                      )}>
                                        {new Date(lead.remind_me).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                      </span>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
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
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => setEditingLead(lead)}
                                      title="Edit lead details"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 hover:text-destructive"
                                      onClick={() => handleUnassignLead(lead.id)}
                                      title="Return to unassigned leads"
                                    >
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
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
