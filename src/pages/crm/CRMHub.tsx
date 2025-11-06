import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Flame, UserPlus, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type SortOption = "remind_me" | "visa_expiry_date" | "created_at";

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
}

const CRMHub = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, user } = useAdminCheck();
  
  const [unassignedLeads, setUnassignedLeads] = useState<Lead[]>([]);
  const [myLeads, setMyLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("created_at");
  const [showOnlyHot, setShowOnlyHot] = useState(false);
  const [assigningLeadId, setAssigningLeadId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadLeads();
    }
  }, [user, sortBy, showOnlyHot]);

  const loadLeads = async () => {
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

      // Apply sorting
      unassignedQuery = unassignedQuery.order(sortBy, { ascending: true, nullsFirst: false });
      myLeadsQuery = myLeadsQuery.order(sortBy, { ascending: true, nullsFirst: false });

      const [unassignedResult, myLeadsResult] = await Promise.all([
        unassignedQuery,
        myLeadsQuery,
      ]);

      if (unassignedResult.error) throw unassignedResult.error;
      if (myLeadsResult.error) throw myLeadsResult.error;

      setUnassignedLeads(unassignedResult.data || []);
      setMyLeads(myLeadsResult.data || []);
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

      loadLeads();
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

      loadLeads();
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
            <Badge variant="outline" className="text-xs">
              {lead.status}
            </Badge>
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">CRM Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your leads and assignments
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
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
        </div>

        {/* Two Column Layout */}
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
      </div>
    </Layout>
  );
};

export default CRMHub;
