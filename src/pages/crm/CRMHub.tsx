import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Flame, UserPlus, UserMinus, LayoutGrid, Table as TableIcon, Download, Upload, Anchor, XCircle, Pencil, Archive, BarChart3, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import RoundRobinToggle from "@/components/crm/RoundRobinToggle";
import { ReminderSummaryWidget } from "@/components/crm/ReminderSummaryWidget";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LostReasonDialog } from "@/components/crm/LostReasonDialog";
import { AssignPreviouslyLostDialog } from "@/components/crm/AssignPreviouslyLostDialog";
import { PreviouslyLostBadge } from "@/components/crm/PreviouslyLostBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type SortOption = "remind_me" | "visa_expiry_date" | "created_at" | "updated_at";
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
  lead_source: string | null;
  comments: string | null;
  archived: boolean;
  previously_lost: boolean | null;
  lost_reason: string | null;
  lost_by: string | null;
  lost_at: string | null;
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
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Check if user is super admin
  useEffect(() => {
    if (user) {
      setIsSuperAdmin(user.email === 'rami@tadmaids.com');
    }
  }, [user]);
  
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [unassignedLeads, setUnassignedLeads] = useState<Lead[]>([]);
  const [myLeads, setMyLeads] = useState<Lead[]>([]);
  const [adminAllLeads, setAdminAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("created_at");
  const [nationalityFilter, setNationalityFilter] = useState<string>("all");
  const [showOnlyHot, setShowOnlyHot] = useState(false);
  const [showOnlyToday, setShowOnlyToday] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [assigningLeadId, setAssigningLeadId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [debouncedAdminSearch, setDebouncedAdminSearch] = useState("");
  const [myLeadsStatusFilter, setMyLeadsStatusFilter] = useState<string>("all");
  const [unassignedStatusFilter, setUnassignedStatusFilter] = useState<string>("all");
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>("all");
  const [users, setUsers] = useState<User[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    "New Lead": 0,
    "Warm": 0,
    "HOT": 0,
    "SOLD": 0,
    "LOST": 0,
  });
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [lostLeadId, setLostLeadId] = useState<string | null>(null);
  const [lostLeadName, setLostLeadName] = useState<string>("");
  const [assignPreviouslyLostDialogOpen, setAssignPreviouslyLostDialogOpen] = useState(false);
  const [previouslyLostLead, setPreviouslyLostLead] = useState<Lead | null>(null);
  const [lostByUser, setLostByUser] = useState<string>("");
  const [untakenTodayCount, setUntakenTodayCount] = useState<number>(0);
  
  // Throttle real-time updates
  const lastUpdateTimeRef = useRef(0);
  const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null);

  // Handle search on Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setDebouncedSearch(searchQuery);
      if (isAdmin) {
        setDebouncedAdminSearch(searchQuery);
      }
    }
  };

  const loadLeads = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Admin view with search and status filter
      let adminAccum: Lead[] | null = null;
      if (isAdmin) {
        // Determine sort order based on sortBy
        const adminAscending = (sortBy === "created_at" || sortBy === "updated_at") ? false : true;
        
        let adminQuery = supabase
          .from("leads")
          .select("*")
          .order(sortBy, { ascending: adminAscending, nullsFirst: false });

        // Filter archived leads unless toggle is on OR searching (show all when searching)
        if (!showArchived && !debouncedAdminSearch) {
          adminQuery = adminQuery.eq("archived", false);
        }

      // Apply nationality filter
      if (nationalityFilter !== "all") {
        adminQuery = adminQuery.eq("nationality_code", nationalityFilter);
      }

      // Apply admin search filter
      if (debouncedAdminSearch) {
          adminQuery = adminQuery.or(
            `mobile_number.ilike.%${debouncedAdminSearch}%,` +
            `client_name.ilike.%${debouncedAdminSearch}%,` +
            `email.ilike.%${debouncedAdminSearch}%,` +
            `service_required.ilike.%${debouncedAdminSearch}%,` +
            `nationality_code.ilike.%${debouncedAdminSearch}%,` +
            `emirate.ilike.%${debouncedAdminSearch}%,` +
            `lead_source.ilike.%${debouncedAdminSearch}%`
          );
        }

        // Apply admin status filter
        if (adminStatusFilter !== "all") {
          adminQuery = adminQuery.eq("status", adminStatusFilter as any);
        }

        const { data, error } = await adminQuery;
        if (error) throw error;
        adminAccum = data || [];
        setAdminAllLeads(adminAccum);
      }

      // Build the query for unassigned leads
      let unassignedQuery = supabase
        .from("leads")
        .select("*")
        .is("assigned_to", null);

      // Filter archived leads unless toggle is on OR searching (show all when searching)
      if (!showArchived && !debouncedSearch) {
        unassignedQuery = unassignedQuery.eq("archived", false);
      }

      // Apply search filter to unassigned
      if (debouncedSearch) {
        unassignedQuery = unassignedQuery.or(
          `mobile_number.ilike.%${debouncedSearch}%,` +
          `client_name.ilike.%${debouncedSearch}%,` +
          `email.ilike.%${debouncedSearch}%`
        );
      }

      // Apply status filter to unassigned
      if (unassignedStatusFilter !== "all") {
        unassignedQuery = unassignedQuery.eq("status", unassignedStatusFilter as any);
      }

      // Apply nationality filter to unassigned
      if (nationalityFilter !== "all") {
        unassignedQuery = unassignedQuery.eq("nationality_code", nationalityFilter);
      }

      // Build the query for my assigned leads
      let myLeadsQuery = supabase
        .from("leads")
        .select("*")
        .eq("assigned_to", user.id);

      // Filter archived leads unless toggle is on OR searching (show all when searching)
      if (!showArchived && !debouncedSearch) {
        myLeadsQuery = myLeadsQuery.eq("archived", false);
      }

      // Apply search filter to my leads
      if (debouncedSearch) {
        myLeadsQuery = myLeadsQuery.or(
          `mobile_number.ilike.%${debouncedSearch}%,` +
          `client_name.ilike.%${debouncedSearch}%,` +
          `email.ilike.%${debouncedSearch}%`
        );
      }

      // Apply status filter to my leads
      if (myLeadsStatusFilter !== "all") {
        myLeadsQuery = myLeadsQuery.eq("status", myLeadsStatusFilter as any);
      }

      // Apply nationality filter to my leads
      if (nationalityFilter !== "all") {
        myLeadsQuery = myLeadsQuery.eq("nationality_code", nationalityFilter);
      }

      // Apply HOT filter if enabled
      if (showOnlyHot) {
        unassignedQuery = unassignedQuery.eq("hot", true);
        myLeadsQuery = myLeadsQuery.eq("hot", true);
      }

      // Apply TODAY filter if enabled
      if (showOnlyToday) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString();
        unassignedQuery = unassignedQuery.gte("created_at", todayStr);
        myLeadsQuery = myLeadsQuery.gte("created_at", todayStr);
      }

      // Apply sorting - newest first for created_at and updated_at, earliest first for other dates
      const ascending = (sortBy === "created_at" || sortBy === "updated_at") ? false : true;
      unassignedQuery = unassignedQuery.order(sortBy, { ascending, nullsFirst: false });
      myLeadsQuery = myLeadsQuery.order(sortBy, { ascending, nullsFirst: false });

      const [unassignedResult, myLeadsResult] = await Promise.all([
        unassignedQuery,
        myLeadsQuery,
      ]);

      if (unassignedResult.error) throw unassignedResult.error;
      if (myLeadsResult.error) throw myLeadsResult.error;

      const combined = [...(unassignedResult.data || []), ...(myLeadsResult.data || [])];
      const allVisibleLeads = isAdmin && adminAccum ? adminAccum : combined;
      setUnassignedLeads(unassignedResult.data || []);
      setMyLeads(myLeadsResult.data || []);
      setAllLeads(allVisibleLeads);

      // Calculate status counts from visible leads only
      const statuses: Array<"New Lead" | "Warm" | "HOT" | "SOLD" | "LOST"> = ["New Lead", "Warm", "HOT", "SOLD", "LOST"];
      const newStatusCounts = statuses.reduce((acc, status) => {
        const count = allVisibleLeads.filter(lead => lead.status === status).length;
        return { ...acc, [status]: count };
      }, {} as Record<string, number>);
      
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
  }, [user, sortBy, nationalityFilter, showOnlyHot, showOnlyToday, showArchived, isAdmin, debouncedSearch, debouncedAdminSearch, unassignedStatusFilter, myLeadsStatusFilter, adminStatusFilter]);

  const fetchUsers = useCallback(async () => {
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
  }, []);

  // Fetch untaken leads count from today
  const fetchUntakenTodayCount = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayISO)
        .is("assigned_to", null);

      if (error) throw error;
      setUntakenTodayCount(count || 0);
    } catch (error) {
      console.error("Error fetching untaken leads count:", error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadLeads();
      fetchUntakenTodayCount();
    }
  }, [user, loadLeads]);
  
  // Fetch users only once on mount
  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user, fetchUsers]);

  // Real-time subscription for leads - throttled to reduce re-renders
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
          // Throttle updates to max once per second
          const now = Date.now();
          if (now - lastUpdateTimeRef.current < 1000) {
            // Queue update for later
            if (pendingUpdateRef.current) {
              clearTimeout(pendingUpdateRef.current);
            }
            pendingUpdateRef.current = setTimeout(() => {
              loadLeads();
              lastUpdateTimeRef.current = Date.now();
            }, 1000);
            return;
          }
          
          lastUpdateTimeRef.current = now;
          const newLead: any = (payload as any).new || null;
          const oldLead: any = (payload as any).old || null;
          const id = (newLead && newLead.id) || (oldLead && oldLead.id);

          // Only update if this lead is relevant to the current user
          const isRelevantToUser = 
            newLead?.assigned_to === user.id || 
            oldLead?.assigned_to === user.id || 
            newLead?.assigned_to === null ||
            isAdmin;

          if (!isRelevantToUser) return;

          // Optimized update: only update the specific lead that changed
          if (newLead) {
            // Update admin all leads
            if (isAdmin) {
              setAdminAllLeads((prev) => {
                const filtered = prev.filter((l) => l.id !== id);
                return [newLead as any, ...filtered];
              });
            }

            // Update unassigned leads
            setUnassignedLeads((prev) => {
              const filtered = prev.filter((l) => l.id !== id);
              return newLead.assigned_to === null ? [newLead as any, ...filtered] : filtered;
            });

            // Update my leads
            setMyLeads((prev) => {
              const filtered = prev.filter((l) => l.id !== id);
              return newLead.assigned_to === user.id ? [newLead as any, ...filtered] : filtered;
            });

            // Update untaken today count when leads are assigned/unassigned
            fetchUntakenTodayCount();
          } else {
            // Lead was deleted
            setUnassignedLeads((prev) => prev.filter((l) => l.id !== id));
            setMyLeads((prev) => prev.filter((l) => l.id !== id));
            setAdminAllLeads((prev) => prev.filter((l) => l.id !== id));
            fetchUntakenTodayCount();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin]);

  const handleAssignToMe = async (leadId: string) => {
    if (!user) return;
    
    // Check if the lead was previously lost
    const lead = [...unassignedLeads, ...myLeads].find(l => l.id === leadId);
    
    if (lead?.previously_lost) {
      // Fetch the user who marked it as lost
      if (lead.lost_by) {
        const { data: lostByProfile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", lead.lost_by)
          .maybeSingle();
        
        if (lostByProfile) {
          setLostByUser(lostByProfile.full_name || lostByProfile.email || "Unknown");
        }
      }
      
      setPreviouslyLostLead(lead);
      setAssignPreviouslyLostDialogOpen(true);
      return;
    }
    
    await assignLeadToUser(leadId);
  };

  const assignLeadToUser = async (leadId: string) => {
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
    if (newStatus === "LOST") {
      // Find the lead to get its name
      const lead = [...myLeads, ...unassignedLeads, ...adminAllLeads].find(l => l.id === leadId);
      setLostLeadId(leadId);
      setLostLeadName(lead?.client_name || "this lead");
      setLostDialogOpen(true);
      return;
    }

    try {
      const updateData: any = { status: newStatus };

      if (newStatus === "Called No Answer" || newStatus === "Called Unanswer 2") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        updateData.remind_me = tomorrow.toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", leadId);

      if (error) throw error;

      let description = `Lead status updated to ${newStatus}`;
      if (newStatus === "Called No Answer" || newStatus === "Called Unanswer 2") {
        description += " and reminder set to tomorrow";
      }

      toast({
        title: "Success",
        description,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLostConfirm = async (reason: string) => {
    if (!lostLeadId || !user) return;

    try {
      const twoYears = new Date();
      twoYears.setFullYear(twoYears.getFullYear() + 2);

      const { error } = await supabase
        .from("leads")
        .update({
          status: "LOST",
          remind_me: twoYears.toISOString().split('T')[0],
          assigned_to: null, // Unassign the lead
          archived: true, // Archive so it doesn't appear in incoming
          previously_lost: true,
          lost_reason: reason,
          lost_by: user.id,
          lost_at: new Date().toISOString(),
        })
        .eq("id", lostLeadId);

      if (error) throw error;

      // Log the activity
      await supabase.from("lead_activities").insert({
        lead_id: lostLeadId,
        user_id: user.id,
        activity_type: "status_change",
        title: "Lead Marked as LOST",
        description: `Lead marked as LOST and unassigned. Reason: ${reason}`,
      });

      toast({
        title: "Success",
        description: "Lead marked as LOST and archived",
      });
      
      setLostDialogOpen(false);
      setLostLeadId(null);
      setLostLeadName("");
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

  const handleExportLeads = () => {
    if (!isSuperAdmin) {
      toast({
        title: "Access Denied",
        description: "Only super admin can export leads",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the leads to export based on admin view
      const leadsToExport = adminAllLeads.length > 0 ? adminAllLeads : allLeads;
      
      if (leadsToExport.length === 0) {
        toast({
          title: "No Data",
          description: "No leads to export",
          variant: "destructive",
        });
        return;
      }

      // Add watermark info
      const timestamp = new Date().toISOString();
      const exporterEmail = user?.email || "unknown";
      
      // Create CSV content
      const headers = [
        "Client Name",
        "Mobile Number",
        "Email",
        "Status",
        "Service Required",
        "Nationality",
        "Emirate",
        "Hot",
        "Lead Source",
        "Assigned To",
        "Created At",
        "Remind Me",
        "Visa Expiry",
        "Comments",
        "Exported By",
        "Export Timestamp"
      ];

      const csvContent = [
        headers.join(","),
        ...leadsToExport.map(lead => [
          `"${lead.client_name || ""}"`,
          `"${lead.mobile_number || ""}"`,
          `"${lead.email || ""}"`,
          `"${lead.status || ""}"`,
          `"${lead.service_required || ""}"`,
          `"${lead.nationality_code || ""}"`,
          `"${lead.emirate || ""}"`,
          lead.hot ? "Yes" : "No",
          `"${lead.lead_source || ""}"`,
          `"${getAssignedEmail(lead.assigned_to)}"`,
          `"${lead.created_at || ""}"`,
          `"${lead.remind_me || ""}"`,
          `"${lead.visa_expiry_date || ""}"`,
          `"${(lead.comments || "").replace(/"/g, '""')}"`,
          `"${exporterEmail}"`,
          `"${timestamp}"`
        ].join(","))
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `leads_export_${timestamp.split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Exported ${leadsToExport.length} leads with watermark`,
      });
    } catch (error: any) {
      console.error("Error exporting leads:", error);
      toast({
        title: "Export Failed",
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

  // No client-side filtering needed - all filtering is done server-side now
  const filteredUnassignedLeads = useMemo(() => unassignedLeads, [unassignedLeads]);
  const filteredMyLeads = useMemo(() => myLeads, [myLeads]);
  const filteredAdminAllLeads = useMemo(() => adminAllLeads, [adminAllLeads]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  const isCreatedToday = (createdAt: string) => {
    const today = new Date();
    const created = new Date(createdAt);
    return (
      created.getDate() === today.getDate() &&
      created.getMonth() === today.getMonth() &&
      created.getFullYear() === today.getFullYear()
    );
  };

  const isUpdatedToday = (updatedAt: string) => {
    const today = new Date();
    const updated = new Date(updatedAt);
    return (
      updated.getDate() === today.getDate() &&
      updated.getMonth() === today.getMonth() &&
      updated.getFullYear() === today.getFullYear()
    );
  };

  const LeadCard = ({ lead, showAssignButton }: { lead: Lead; showAssignButton: boolean }) => {
    // Get the lost_by user's name from the users array
    const lostByUserName = lead.lost_by 
      ? users.find(u => u.id === lead.lost_by)?.full_name || users.find(u => u.id === lead.lost_by)?.email || "Unknown"
      : undefined;

    return (
    <div
      className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-card"
      onClick={() => navigate(`/crm/leads/${lead.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-sm truncate">
              {lead.client_name || "Unnamed Client"}
            </h3>
            {(isCreatedToday(lead.created_at) || isUpdatedToday(lead.updated_at)) && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                TODAY
              </Badge>
            )}
            {lead.hot && <Flame className="h-4 w-4 text-orange-500 flex-shrink-0" />}
            {lead.previously_lost && (
              <PreviouslyLostBadge
                lostBy={lostByUserName}
                lostAt={lead.lost_at || undefined}
                lostReason={lead.lost_reason || undefined}
              />
            )}
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
                    <SelectItem value="Called No Answer">Called No Answer</SelectItem>
                    <SelectItem value="Called Engaged">Called Engaged</SelectItem>
                    <SelectItem value="Called COLD">Called COLD</SelectItem>
                    <SelectItem value="Called Unanswer 2">Called Unanswer 2</SelectItem>
                    <SelectItem value="No Connection">No Connection</SelectItem>
                    <SelectItem value="Warm">Warm</SelectItem>
                    <SelectItem value="HOT">HOT</SelectItem>
                    <SelectItem value="SOLD">SOLD</SelectItem>
                    <SelectItem value="LOST">LOST</SelectItem>
                    <SelectItem value="PROBLEM">PROBLEM</SelectItem>
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
          ) : isAdmin ? (
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
          ) : null}
        </div>
      </div>
    </div>
    );
  };

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
        {/* Sales Reports Center Banner */}
        <Card className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Sales Reports Center</h3>
                  <p className="text-sm text-white/90">Access all sales reports, analytics, KPIs, and team performance in one place</p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                className="font-semibold flex-shrink-0"
                onClick={() => navigate("/crm/sales-reports")}
              >
                View Reports →
              </Button>
            </div>
          </CardContent>
        </Card>

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

        {/* Quick Navigation */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/crm/my-dashboard')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            My Sales Dashboard
          </Button>
          {isAdmin && (
            <Button variant="outline" onClick={() => navigate('/crm/team-dashboard')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Team Dashboard
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline" onClick={() => navigate('/hr/nationality-dashboard')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Nationality Report
            </Button>
          )}
        </div>

        {/* Untaken Leads Warning */}
        {untakenTodayCount > 0 && (
          <div className="mb-6 relative overflow-hidden rounded-xl border border-destructive/20 bg-gradient-to-br from-destructive/5 via-background to-destructive/5 p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 animate-pulse rounded-full bg-destructive/20 blur"></div>
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/30">
                  <AlertTriangle className="h-8 w-8 text-destructive animate-pulse" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold text-foreground">Unassigned Leads</h3>
                  <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-3 rounded-full bg-destructive text-destructive-foreground text-sm font-bold shadow-md animate-pulse">
                    {untakenTodayCount}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {untakenTodayCount === 1 ? 'Lead was' : 'Leads were'} added today and {untakenTodayCount === 1 ? 'needs' : 'need'} to be assigned
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{isAdmin ? (adminAllLeads.length || (unassignedLeads.length + myLeads.length)) : (unassignedLeads.length + myLeads.length)}</p>
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

        {/* Reminder Summary Widget */}
        {!isAdmin && user && (
          <ReminderSummaryWidget userId={user.id} />
        )}

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
                  <SelectItem value="updated_at">Last Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="nationality-filter" className="text-sm">Nationality:</Label>
              <Select value={nationalityFilter} onValueChange={setNationalityFilter}>
                <SelectTrigger id="nationality-filter" className="w-[180px]">
                  <SelectValue placeholder="All Nationalities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Nationalities</SelectItem>
                  <SelectItem value="PH">Philippines</SelectItem>
                  <SelectItem value="ID">Indonesia</SelectItem>
                  <SelectItem value="ET">Ethiopia</SelectItem>
                  <SelectItem value="KE">Kenya</SelectItem>
                  <SelectItem value="UG">Uganda</SelectItem>
                  <SelectItem value="NP">Nepal</SelectItem>
                  <SelectItem value="BD">Bangladesh</SelectItem>
                  <SelectItem value="LK">Sri Lanka</SelectItem>
                  <SelectItem value="MM">Myanmar</SelectItem>
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

            <div className="flex items-center gap-2">
              <Switch
                id="today-filter"
                checked={showOnlyToday}
                onCheckedChange={setShowOnlyToday}
              />
              <Label htmlFor="today-filter" className="text-sm cursor-pointer">
                📅 Today's Leads
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="archived-toggle"
                checked={showArchived}
                onCheckedChange={setShowArchived}
              />
              <Label htmlFor="archived-toggle" className="text-sm cursor-pointer flex items-center gap-1">
                <Archive className="h-4 w-4" />
                Show Archived
              </Label>
            </div>

            <div className="relative flex-1 min-w-[200px] flex gap-2">
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-3"
              />
              <Button 
                onClick={() => {
                  setDebouncedSearch(searchQuery);
                  if (isAdmin) {
                    setDebouncedAdminSearch(searchQuery);
                  }
                }}
                variant="secondary"
                size="sm"
              >
                Search
              </Button>
              {(debouncedSearch || debouncedAdminSearch) && (
                <Button 
                  onClick={() => {
                    setSearchQuery("");
                    setDebouncedSearch("");
                    setDebouncedAdminSearch("");
                  }}
                  variant="ghost"
                  size="sm"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {isAdmin && viewMode === "table" && (
            <div className="flex gap-2">
              {isSuperAdmin && (
                <Button variant="outline" onClick={handleExportLeads}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Leads
                </Button>
              )}
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
          <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: My Assigned Leads */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>My Assigned Leads</span>
                <Badge variant="secondary">{myLeads.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select value={myLeadsStatusFilter} onValueChange={setMyLeadsStatusFilter}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="New Lead">New Lead</SelectItem>
                    <SelectItem value="Called No Answer">Called No Answer</SelectItem>
                    <SelectItem value="Called Engaged">Called Engaged</SelectItem>
                    <SelectItem value="Called COLD">Called COLD</SelectItem>
                    <SelectItem value="Called Unanswer 2">Called Unanswer 2</SelectItem>
                    <SelectItem value="No Connection">No Connection</SelectItem>
                    <SelectItem value="Warm">Warm</SelectItem>
                    <SelectItem value="HOT">HOT</SelectItem>
                    <SelectItem value="SOLD">SOLD</SelectItem>
                    <SelectItem value="LOST">LOST</SelectItem>
                    <SelectItem value="PROBLEM">PROBLEM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredMyLeads.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {myLeadsStatusFilter !== "all" ? "No leads with this status" : "No assigned leads"}
                  </p>
                ) : (
                  filteredMyLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} showAssignButton={false} />
                  ))
                 )}
              </div>
            </CardContent>
          </Card>

          {/* Right: Incoming Leads */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Incoming Leads</span>
                <Badge variant="secondary">{unassignedLeads.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select value={unassignedStatusFilter} onValueChange={setUnassignedStatusFilter}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="New Lead">New Lead</SelectItem>
                    <SelectItem value="Called No Answer">Called No Answer</SelectItem>
                    <SelectItem value="Called Engaged">Called Engaged</SelectItem>
                    <SelectItem value="Called COLD">Called COLD</SelectItem>
                    <SelectItem value="Called Unanswer 2">Called Unanswer 2</SelectItem>
                    <SelectItem value="No Connection">No Connection</SelectItem>
                    <SelectItem value="Warm">Warm</SelectItem>
                    <SelectItem value="HOT">HOT</SelectItem>
                    <SelectItem value="SOLD">SOLD</SelectItem>
                    <SelectItem value="LOST">LOST</SelectItem>
                    <SelectItem value="PROBLEM">PROBLEM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredUnassignedLeads.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {unassignedStatusFilter !== "all" ? "No leads with this status" : "No unassigned leads"}
                  </p>
                ) : (
                  filteredUnassignedLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} showAssignButton={true} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Admin Only: All Leads System-Wide */}
          {isAdmin && (
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>🔐 All Leads (System-Wide)</span>
                  <Badge variant="secondary">{filteredAdminAllLeads.length}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">Complete visibility of all leads regardless of assignment</p>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-2">
                  <Input
                    placeholder="Search all leads by name, phone, or email..."
                    value={adminSearchQuery}
                    onChange={(e) => setAdminSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setDebouncedAdminSearch(adminSearchQuery);
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => setDebouncedAdminSearch(adminSearchQuery)}
                    variant="secondary"
                    size="sm"
                  >
                    Search
                  </Button>
                  {debouncedAdminSearch && (
                    <Button 
                      onClick={() => {
                        setAdminSearchQuery("");
                        setDebouncedAdminSearch("");
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="mb-4">
                  <Select value={adminStatusFilter} onValueChange={setAdminStatusFilter}>
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="New Lead">New Lead</SelectItem>
                      <SelectItem value="Called No Answer">Called No Answer</SelectItem>
                      <SelectItem value="Called Engaged">Called Engaged</SelectItem>
                      <SelectItem value="Called COLD">Called COLD</SelectItem>
                      <SelectItem value="Called Unanswer 2">Called Unanswer 2</SelectItem>
                      <SelectItem value="No Connection">No Connection</SelectItem>
                      <SelectItem value="Warm">Warm</SelectItem>
                      <SelectItem value="HOT">HOT</SelectItem>
                      <SelectItem value="SOLD">SOLD</SelectItem>
                      <SelectItem value="LOST">LOST</SelectItem>
                      <SelectItem value="PROBLEM">PROBLEM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredAdminAllLeads.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {adminSearchQuery || adminStatusFilter !== "all" ? "No leads found matching your criteria" : "No leads in system"}
                    </p>
                  ) : (
                    filteredAdminAllLeads.map((lead) => (
                      <div key={lead.id} className="relative">
                        <LeadCard lead={lead} showAssignButton={false} />
                        {lead.assigned_to && (
                          <Badge variant="outline" className="absolute top-2 right-2 text-xs">
                            Assigned: {getAssignedEmail(lead.assigned_to)}
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          </>
        )}

        {/* Table View */}
        {viewMode === "table" && (
          <>
            {/* Admin Only: All Leads Table */}
            {isAdmin && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🔐 All Leads - System View ({filteredAdminAllLeads.length})
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Complete visibility of all leads with assignments</p>
                  <div className="mt-4 flex gap-2">
                    <Input
                      placeholder="Search all leads by name, phone, or email..."
                      value={adminSearchQuery}
                      onChange={(e) => setAdminSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setDebouncedAdminSearch(adminSearchQuery);
                        }
                      }}
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => setDebouncedAdminSearch(adminSearchQuery)}
                      variant="secondary"
                      size="sm"
                    >
                      Search
                    </Button>
                    {debouncedAdminSearch && (
                      <Button 
                        onClick={() => {
                          setAdminSearchQuery("");
                          setDebouncedAdminSearch("");
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-y-auto max-h-[600px]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Assigned To</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAdminAllLeads.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No leads found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredAdminAllLeads.map((lead) => (
                            <TableRow key={lead.id} className="hover:bg-muted/50">
                              <TableCell>
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {lead.hot && <Flame className="h-4 w-4 text-orange-500" />}
                                    {lead.archived && <Archive className="h-4 w-4 text-muted-foreground" />}
                                    {(isCreatedToday(lead.created_at) || isUpdatedToday(lead.updated_at)) && (
                                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                                        TODAY
                                      </Badge>
                                    )}
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
                                <Badge className={`text-xs ${getStatusColor(lead.status)}`}>
                                  {lead.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>{lead.service_required || '-'}</div>
                                  <div className="text-muted-foreground text-xs">{lead.nationality_code || '-'}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={lead.assigned_to || "unassigned"}
                                  onValueChange={(value) => handleAssignLead(lead.id, value === "unassigned" ? null : value)}
                                >
                                  <SelectTrigger className="w-[140px] h-8 text-xs">
                                    <SelectValue placeholder="Unassigned" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {users.map((u) => (
                                      <SelectItem key={u.id} value={u.id}>
                                        {u.full_name || u.email}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(lead.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/crm/leads/${lead.id}`)}
                                  className="h-7"
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
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                    {(isCreatedToday(lead.created_at) || isUpdatedToday(lead.updated_at)) && (
                                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                                        TODAY
                                      </Badge>
                                    )}
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
                                  {(isCreatedToday(lead.created_at) || isUpdatedToday(lead.updated_at)) && (
                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                                      TODAY
                                    </Badge>
                                  )}
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
          </div>
          </>
        )}
      </div>

      {/* Lost Reason Dialog */}
      <LostReasonDialog
        open={lostDialogOpen}
        onOpenChange={setLostDialogOpen}
        onConfirm={handleLostConfirm}
        leadName={lostLeadName}
      />

      {/* Assign Previously Lost Dialog */}
      <AssignPreviouslyLostDialog
        open={assignPreviouslyLostDialogOpen}
        onOpenChange={setAssignPreviouslyLostDialogOpen}
        onConfirm={() => {
          if (previouslyLostLead) {
            assignLeadToUser(previouslyLostLead.id);
          }
          setAssignPreviouslyLostDialogOpen(false);
          setPreviouslyLostLead(null);
        }}
        leadName={previouslyLostLead?.client_name || "this lead"}
        lostBy={lostByUser}
        lostAt={previouslyLostLead?.lost_at || undefined}
        lostReason={previouslyLostLead?.lost_reason || undefined}
      />
    </Layout>
  );
};

export default CRMHub;
