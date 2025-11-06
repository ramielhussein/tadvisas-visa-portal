import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Flame, UserPlus, UserMinus, LayoutGrid, Table as TableIcon, Download, Upload, Anchor, XCircle, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import RoundRobinToggle from "@/components/crm/RoundRobinToggle";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SortOption = "remind_me" | "visa_expiry_date" | "created_at";
type ViewMode = "cards" | "table";

interface Lead {
  id: string;
  client_name: string | null;
  mobile_number: string;
  status: string;
  service_required: string | null;
  nationality_code: string | null;
  emirate: string | null;
  hot: boolean;
  remind_me: string | null;
  visa_expiry_date: string | null;
  created_at: string;
  assigned_to: string | null;
  email: string | null;
  client_converted: boolean;
  submission_id: string | null;
  updated_at: string;
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

const CRMHub = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, user } = useAdminCheck();
  
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [unassignedLeads, setUnassignedLeads] = useState<Lead[]>([]);
  const [myLeads, setMyLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("created_at");
  const [showOnlyHot, setShowOnlyHot] = useState(false);
  const [assigningLeadId, setAssigningLeadId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    "New Lead": 0,
    "Warm": 0,
    "HOT": 0,
    "SOLD": 0,
    "LOST": 0,
  });

  const loadLeads = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Build the query for unassigned leads
      let unassignedQuery = supabase
        .from("leads")
        .select("*")
        .is("assigned_to", null);

      // Build the query for my assigned leads
      let myLeadsQuery = supabase
        .from("leads")
        .select("*")
        .eq("assigned_to", user.id);

      // Apply HOT filter if enabled
      if (showOnlyHot) {
        unassignedQuery = unassignedQuery.eq("hot", true);
        myLeadsQuery = myLeadsQuery.eq("hot", true);
      }

      // Apply sorting - newest first for created_at, earliest first for dates
      const ascending = sortBy === "created_at" ? false : true;
      unassignedQuery = unassignedQuery.order(sortBy, { ascending, nullsFirst: false });
      myLeadsQuery = myLeadsQuery.order(sortBy, { ascending, nullsFirst: false });

      const [unassignedResult, myLeadsResult] = await Promise.all([
        unassignedQuery,
        myLeadsQuery,
      ]);

      if (unassignedResult.error) throw unassignedResult.error;
      if (myLeadsResult.error) throw myLeadsResult.error;

      setUnassignedLeads(unassignedResult.data || []);
      setMyLeads(myLeadsResult.data || []);
      setAllLeads([...(unassignedResult.data || []), ...(myLeadsResult.data || [])]);

      // Fetch status counts
      const statuses: Array<"New Lead" | "Warm" | "HOT" | "SOLD" | "LOST"> = ["New Lead", "Warm", "HOT", "SOLD", "LOST"];
      const statusCountsPromises = statuses.map(async (status) => {
        const { count } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("status", status);
        return { status, count: count ?? 0 };
      });

      const statusCountsResults = await Promise.all(statusCountsPromises);
      const newStatusCounts = statusCountsResults.reduce(
        (acc, { status, count }) => ({ ...acc, [status]: count }),
        {} as Record<string, number>
      );
      setStatusCounts(newStatusCounts);
    } catch (error: any) {
      console.error("Error loading leads:", error);
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, sortBy, showOnlyHot]);

  useEffect(() => {
    if (user) {
      loadLeads();
      fetchUsers();
    }
  }, [user, loadLeads]);

  // Real-time subscription for leads
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
        },
        (payload) => {
          console.log('Real-time lead change:', payload);
          loadLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadLeads]);

  const fetchUsers = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, permissions")
        .order("email");

      if (profilesError) throw profilesError;

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

  const handleAssignToMe = async (leadId: string) => {
    if (!user) return;
    
    setAssigningLeadId(leadId);
    try {
      const { error } = await supabase
        .from("leads")
        .update({ assigned_to: user.id })
        .eq("id", leadId);

      if (error) throw error;

      // Log the activity
      await supabase.from("lead_activities").insert({
        lead_id: leadId,
        user_id: user.id,
        activity_type: "system",
        title: "Self-Assigned",
        description: "Lead self-assigned",
        metadata: { action: "self_assign" },
      });

      toast({
        title: "Success",
        description: "Lead assigned to you",
      });
    } catch (error: any) {
      console.error("Error assigning lead:", error);
      toast({
        title: "Error",
        description: "Failed to assign lead",
        variant: "destructive",
      });
    } finally {
      setAssigningLeadId(null);
    }
  };

  const handleUnassign = async (leadId: string) => {
    if (!user) return;
    
    setAssigningLeadId(leadId);
    try {
      const { error } = await supabase
        .from("leads")
        .update({ assigned_to: null })
        .eq("id", leadId);

      if (error) throw error;

      // Log the activity
      await supabase.from("lead_activities").insert({
        lead_id: leadId,
        user_id: user.id,
        activity_type: "system",
        title: "Unassigned",
        description: "Lead unassigned",
        metadata: { action: "unassign" },
      });

      toast({
        title: "Success",
        description: "Lead unassigned",
      });
    } catch (error: any) {
      console.error("Error unassigning lead:", error);
      toast({
        title: "Error",
        description: "Failed to unassign lead",
        variant: "destructive",
      });
    } finally {
      setAssigningLeadId(null);
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };

      if (newStatus === "Called No Answer" || newStatus === "Called Unanswer 2") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        updateData.remind_me = tomorrow.toISOString().split('T')[0];
      } else if (newStatus === "LOST") {
        const twoYears = new Date();
        twoYears.setFullYear(twoYears.getFullYear() + 2);
        updateData.remind_me = twoYears.toISOString().split('T')[0];
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
      }

      toast({
        title: "Success",
        description,
      });

      loadLeads();
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

      loadLeads();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      
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
      };

      toast({
        title: "Import Complete",
        description: `Imported ${result.imported} leads. Skipped ${result.duplicates} duplicates. ${result.errors} errors.`,
      });

      loadLeads();
    } catch (error: any) {
      console.error("Error importing Excel:", error);
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const getAssignedEmail = (userId: string | null) => {
    if (!userId) return "Unassigned";
    const user = users.find(u => u.id === userId);
    return user?.full_name || user?.email || "Unknown";
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

  const statusDistribution = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    allLeads.forEach(lead => {
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
      percentage: ((count / allLeads.length) * 100).toFixed(1),
      color: colors[status] || "#94a3b8",
    }));
  }, [allLeads]);

  const filteredUnassignedLeads = useMemo(() => {
    if (!searchQuery) return unassignedLeads;
    const query = searchQuery.toLowerCase();
    return unassignedLeads.filter(lead =>
      (lead.mobile_number?.toLowerCase().includes(query)) ||
      ((lead.client_name || "").toLowerCase().includes(query)) ||
      ((lead.email || "").toLowerCase().includes(query))
    );
  }, [unassignedLeads, searchQuery]);

  const filteredMyLeads = useMemo(() => {
    if (!searchQuery) return myLeads;
    const query = searchQuery.toLowerCase();
    return myLeads.filter(lead =>
      (lead.mobile_number?.toLowerCase().includes(query)) ||
      ((lead.client_name || "").toLowerCase().includes(query)) ||
      ((lead.email || "").toLowerCase().includes(query))
    );
  }, [myLeads, searchQuery]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  const LeadCard = ({ lead, showAssignButton }: { lead: Lead; showAssignButton: boolean }) => (
    <div
      className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-card"
      onClick={() => navigate(`/crm/leads/${lead.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate">
              {lead.client_name || "Unnamed Client"}
            </h3>
            {lead.hot && <Flame className="h-4 w-4 text-orange-500 flex-shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground mb-2">{lead.mobile_number}</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {showAssignButton ? (
              <Badge variant="outline" className="text-xs">
                {lead.status}
              </Badge>
            ) : (
              <div onClick={(e) => e.stopPropagation()}>
                <Select
                  value={lead.status}
                  onValueChange={(value) => handleStatusChange(lead.id, value)}
                >
                  <SelectTrigger className="h-6 text-xs w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New Lead">New Lead</SelectItem>
                    <SelectItem value="Warm">Warm</SelectItem>
                    <SelectItem value="HOT">HOT</SelectItem>
                    <SelectItem value="SOLD">SOLD</SelectItem>
                    <SelectItem value="LOST">LOST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {lead.service_required && (
              <Badge variant="secondary" className="text-xs">
                {lead.service_required}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            {lead.remind_me && (
              <div>Due: {formatDate(lead.remind_me)}</div>
            )}
            {lead.visa_expiry_date && (
              <div>Visa Expiry: {formatDate(lead.visa_expiry_date)}</div>
            )}
            <div>Created: {formatDate(lead.created_at)}</div>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          {showAssignButton ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAssignToMe(lead.id)}
              disabled={assigningLeadId === lead.id}
              className="h-8"
            >
              {assigningLeadId === lead.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-3 w-3 mr-1" />
                  Assign
                </>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUnassign(lead.id)}
              disabled={assigningLeadId === lead.id}
              className="h-8"
            >
              {assigningLeadId === lead.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <UserMinus className="h-3 w-3 mr-1" />
                  Unassign
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">CRM Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your leads and assignments
            </p>
          </div>
          
          {/* View Mode Toggle */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="w-auto">
            <TabsList>
              <TabsTrigger value="cards" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Card View
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-2">
                <TableIcon className="h-4 w-4" />
                Table View
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{unassignedLeads.length + myLeads.length}</p>
            </CardContent>
          </Card>
          {["New Lead", "Warm", "HOT", "SOLD", "LOST"].map((status) => (
            <Card key={status}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{status}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{statusCounts[status] || 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin Features */}
        {isAdmin && viewMode === "table" && (
          <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RoundRobinToggle />
            <Card>
              <CardHeader>
                <CardTitle>Lead Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {allLeads.length > 0 ? (
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

        {/* Filters and Actions */}
        <div className="flex items-center gap-4 mb-6 flex-wrap justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label htmlFor="sort-by" className="text-sm">Sort by:</Label>
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger id="sort-by" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remind_me">Due Date</SelectItem>
                  <SelectItem value="visa_expiry_date">Visa Expiry</SelectItem>
                  <SelectItem value="created_at">Date Added</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="hot-filter"
                checked={showOnlyHot}
                onCheckedChange={setShowOnlyHot}
              />
              <Label htmlFor="hot-filter" className="text-sm cursor-pointer">
                🔥 Hot Leads Only
              </Label>
            </div>

            {viewMode === "table" && (
              <div className="relative flex-1 min-w-[200px]">
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-3"
                />
              </div>
            )}
          </div>

          {isAdmin && viewMode === "table" && (
            <div className="flex gap-2">
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
            </div>
          )}
        </div>

        {/* Card View */}
        {viewMode === "cards" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Unassigned Leads */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Incoming Leads</span>
                <Badge variant="secondary">{unassignedLeads.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {unassignedLeads.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No unassigned leads
                  </p>
                ) : (
                  unassignedLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} showAssignButton={true} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right: My Assigned Leads */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>My Assigned Leads</span>
                <Badge variant="secondary">{myLeads.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {myLeads.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No assigned leads
                  </p>
                ) : (
                  myLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} showAssignButton={false} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Table View */}
        {viewMode === "table" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Unassigned Leads Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  Incoming Leads ({filteredUnassignedLeads.length})
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
                      {filteredUnassignedLeads.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No incoming leads
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUnassignedLeads.map((lead) => (
                          <TableRow key={lead.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {lead.hot && <Flame className="h-4 w-4 text-orange-500" />}
                                  {lead.client_name || "Unnamed"}
                                </div>
                                <div 
                                  onClick={() => navigate(`/crm/leads/${lead.id}`)}
                                  className="text-sm text-primary cursor-pointer hover:underline"
                                >
                                  {lead.mobile_number}
                                </div>
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
                                onClick={() => handleAssignToMe(lead.id)}
                                disabled={assigningLeadId === lead.id}
                                title="Claim this lead"
                              >
                                {assigningLeadId === lead.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Anchor className="h-4 w-4" />
                                )}
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

            {/* My Leads Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pencil className="h-5 w-5" />
                  My Leads ({filteredMyLeads.length})
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
                      {filteredMyLeads.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No assigned leads
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMyLeads.map((lead) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const reminderDate = lead.remind_me ? new Date(lead.remind_me) : null;
                          const isOverdue = reminderDate && reminderDate < today;
                          const isDueToday = reminderDate && reminderDate.getTime() === today.getTime();

                          return (
                            <TableRow key={lead.id} className="hover:bg-muted/50">
                              <TableCell>
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {lead.hot && <Flame className="h-4 w-4 text-orange-500" />}
                                    <button
                                      onClick={() => navigate(`/crm/leads/${lead.id}`)}
                                      className="hover:text-primary hover:underline text-left"
                                    >
                                      {lead.client_name || "Unnamed"}
                                    </button>
                                  </div>
                                  <div className="text-sm text-muted-foreground">{lead.mobile_number}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={lead.status}
                                  onValueChange={(value) => handleStatusChange(lead.id, value)}
                                >
                                  <SelectTrigger className={`w-[140px] h-8 text-xs ${getStatusColor(lead.status)}`}>
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
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className={`text-xs ${isOverdue ? 'text-red-500 font-bold' : isDueToday ? 'text-orange-500 font-bold' : 'text-muted-foreground'}`}>
                                    {lead.remind_me ? formatDate(lead.remind_me) : 'No reminder'}
                                  </div>
                                  <Input
                                    type="number"
                                    placeholder="Days"
                                    min="1"
                                    max="3650"
                                    className="h-7 w-20 text-xs"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const days = parseInt(e.currentTarget.value);
                                        if (days) {
                                          handleReminderDaysChange(lead.id, days);
                                          e.currentTarget.value = '';
                                        }
                                      }
                                    }}
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {isAdmin && (
                                    <Select
                                      value={lead.assigned_to || "unassigned"}
                                      onValueChange={(value) => handleAssignLead(lead.id, value === "unassigned" ? null : value)}
                                    >
                                      <SelectTrigger className="w-[100px] h-7 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="unassigned">Unassign</SelectItem>
                                        {users.map((u) => (
                                          <SelectItem key={u.id} value={u.id}>
                                            {u.full_name || u.email}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                  {!isAdmin && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleUnassign(lead.id)}
                                      disabled={assigningLeadId === lead.id}
                                    >
                                      {assigningLeadId === lead.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <XCircle className="h-3 w-3" />
                                      )}
                                    </Button>
                                  )}
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
        )}
      </div>
    </Layout>
  );
};

export default CRMHub;
