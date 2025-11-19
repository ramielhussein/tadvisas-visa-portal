import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import Layout from "@/components/Layout";
import QuickLeadEntry from "@/components/crm/QuickLeadEntry";
import {
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  User, 
  Briefcase,
  MessageSquare,
  Edit,
  Clock,
  FileText,
  PhoneCall,
  Video,
  CheckCircle2,
  Archive,
  ArchiveRestore,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LostReasonDialog } from "@/components/crm/LostReasonDialog";
import { PreviouslyLostBadge } from "@/components/crm/PreviouslyLostBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    email: string;
  } | undefined;
}

interface Lead {
  id: string;
  client_name: string;
  email: string | null;
  mobile_number: string;
  emirate: string | null;
  status: string;
  service_required: string | null;
  nationality_code: string | null;
  remind_me: string;
  visa_expiry_date: string | null;
  created_at: string;
  assigned_to: string | null;
  client_converted: boolean;
  lead_source?: string | null;
  comments?: string | null;
  hot?: boolean | null;
  archived?: boolean;
  previously_lost?: boolean | null;
  lost_reason?: string | null;
  lost_by?: string | null;
  lost_at?: string | null;
}

const LeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdminCheck();
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLead, setEditingLead] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [activityType, setActivityType] = useState<string>("note");
  const [addingActivity, setAddingActivity] = useState(false);
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [lostByUser, setLostByUser] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reminderDate, setReminderDate] = useState<string>("");
  const [updatingReminder, setUpdatingReminder] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLeadDetails();
      fetchActivities();
    }
  }, [id]);

  useEffect(() => {
    if (lead?.remind_me) {
      setReminderDate(lead.remind_me);
    }
  }, [lead?.remind_me]);

  useEffect(() => {
    const fetchLostByUser = async () => {
      if (lead?.lost_by) {
        const { data: lostByProfile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", lead.lost_by)
          .maybeSingle();
        
        if (lostByProfile) {
          setLostByUser(lostByProfile.full_name || lostByProfile.email || "Unknown");
        }
      }
    };

    fetchLostByUser();
  }, [lead?.lost_by]);

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast({
          title: "Lead not found",
          variant: "destructive",
        });
        navigate("/crm/leads");
        return;
      }

      setLead(data);
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

  const fetchActivities = async () => {
    try {
      // Fetch activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from("lead_activities")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false });

      if (activitiesError) throw activitiesError;
      
      if (!activitiesData || activitiesData.length === 0) {
        setActivities([]);
        return;
      }

      // Optimized: Fetch all profiles in a single query instead of N queries
      const userIds = [...new Set(activitiesData.map(a => a.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Create a map for quick lookup
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.id, p])
      );

      // Merge data
      const activitiesWithProfiles = activitiesData.map(activity => ({
        ...activity,
        profiles: profilesMap.get(activity.user_id),
      }));

      setActivities(activitiesWithProfiles as Activity[]);
    } catch (error: any) {
      console.error("Error fetching activities:", error);
    }
  };

  const handleAddActivity = async () => {
    if (!newNote.trim()) return;

    try {
      setAddingActivity(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("lead_activities")
        .insert({
          lead_id: id,
          user_id: user.id,
          activity_type: activityType,
          title: getActivityTitle(activityType),
          description: newNote,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Activity added",
      });

      setNewNote("");
      fetchActivities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAddingActivity(false);
    }
  };

  const getActivityTitle = (type: string) => {
    const titles: Record<string, string> = {
      note: "Note added",
      call: "Phone call",
      email: "Email sent",
      meeting: "Meeting scheduled",
      whatsapp: "WhatsApp message",
      status_change: "Status changed",
      assignment: "Lead assigned",
    };
    return titles[type] || "Activity";
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, any> = {
      note: FileText,
      call: PhoneCall,
      email: Mail,
      meeting: Video,
      whatsapp: MessageSquare,
      status_change: CheckCircle2,
      assignment: User,
    };
    const Icon = icons[type] || FileText;
    return <Icon className="w-4 h-4" />;
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

  const handleWhatsApp = async () => {
    if (lead?.mobile_number) {
      // Log the WhatsApp activity first
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("lead_activities").insert({
            lead_id: lead.id,
            user_id: user.id,
            activity_type: "whatsapp",
            title: "WhatsApp Message",
            description: `Opened WhatsApp to message ${lead.mobile_number}`,
          });
          
          // Refresh activities
          fetchActivities();
        }
      } catch (error) {
        console.error("Error logging WhatsApp activity:", error);
      }
      
      const cleanNumber = lead.mobile_number.replace(/[^\d+]/g, '');
      window.open(`https://wa.me/${cleanNumber}`, '_blank');
    }
  };

  const handleCall = async () => {
    if (lead?.mobile_number) {
      // Log the call activity first
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("lead_activities").insert({
            lead_id: lead.id,
            user_id: user.id,
            activity_type: "call",
            title: "Phone Call",
            description: `Initiated call to ${lead.mobile_number}`,
          });
          
          // Refresh activities
          fetchActivities();
        }
      } catch (error) {
        console.error("Error logging call activity:", error);
      }
      
      // Open phone dialer
      window.location.href = `tel:${lead.mobile_number}`;
    }
  };

  const handleEmail = async () => {
    if (lead?.email) {
      // Log the email activity first
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("lead_activities").insert({
            lead_id: lead.id,
            user_id: user.id,
            activity_type: "email",
            title: "Email Sent",
            description: `Opened email client to send email to ${lead.email}`,
          });
          
          // Refresh activities
          fetchActivities();
        }
      } catch (error) {
        console.error("Error logging email activity:", error);
      }
      
      // Open email client
      window.location.href = `mailto:${lead.email}`;
    }
  };

  const handleHotToggle = async (checked: boolean) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ hot: checked })
        .eq("id", lead?.id);

      if (error) throw error;

      // Log the activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("lead_activities").insert({
          lead_id: lead?.id,
          user_id: user.id,
          activity_type: "status_change",
          title: "Hot Status Changed",
          description: `Lead marked as ${checked ? "HOT" : "not hot"}`,
        });
      }

      // Update local state
      setLead(prev => prev ? { ...prev, hot: checked } : null);
      
      toast({
        title: "Success",
        description: `Lead marked as ${checked ? "HOT" : "not hot"}`,
      });

      fetchActivities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleArchiveToggle = async () => {
    try {
      const newArchivedState = !lead?.archived;
      
      const { error } = await supabase
        .from("leads")
        .update({ archived: newArchivedState })
        .eq("id", lead?.id);

      if (error) throw error;

      // Log the activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("lead_activities").insert({
          lead_id: lead?.id,
          user_id: user.id,
          activity_type: "system",
          title: newArchivedState ? "Lead Archived" : "Lead Restored",
          description: newArchivedState 
            ? "Lead moved to archive" 
            : "Lead restored from archive",
        });
      }

      // Update local state
      setLead(prev => prev ? { ...prev, archived: newArchivedState } : null);
      
      toast({
        title: "Success",
        description: newArchivedState ? "Lead archived" : "Lead restored",
      });

      fetchActivities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLostConfirm = async (reason: string) => {
    if (!lead?.id) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

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
        .eq("id", lead.id);

      if (error) throw error;

      // Log the activity
      await supabase.from("lead_activities").insert({
        lead_id: lead.id,
        user_id: user.id,
        activity_type: "status_change",
        title: "Lead Marked as LOST",
        description: `Lead marked as LOST and unassigned. Reason: ${reason}`,
      });

      // Update local state
      setLead(prev => prev ? {
        ...prev,
        status: "LOST",
        assigned_to: null,
        archived: true,
        previously_lost: true,
        lost_reason: reason,
        lost_by: user.id,
        lost_at: new Date().toISOString(),
      } : null);

      toast({
        title: "Success",
        description: "Lead marked as LOST and archived",
      });
      
      setLostDialogOpen(false);
      fetchActivities();
      
      // Navigate back to CRM after 2 seconds
      setTimeout(() => {
        navigate("/crm/leads");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!lead?.id) return;

    try {
      setDeleting(true);

      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", lead.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });

      navigate("/crm/leads");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleUpdateReminder = async () => {
    if (!lead?.id || !reminderDate) return;

    try {
      setUpdatingReminder(true);

      const { error } = await supabase
        .from("leads")
        .update({ remind_me: reminderDate })
        .eq("id", lead.id);

      if (error) throw error;

      // Log the activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("lead_activities").insert({
          lead_id: lead.id,
          user_id: user.id,
          activity_type: "system",
          title: "Reminder Updated",
          description: `Reminder date set to ${new Date(reminderDate).toLocaleDateString('en-GB')}`,
        });
      }

      // Update local state
      setLead(prev => prev ? { ...prev, remind_me: reminderDate } : null);

      toast({
        title: "Success",
        description: "Reminder date updated",
      });

      fetchActivities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdatingReminder(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!lead?.id) return;

    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus as any })
        .eq("id", lead.id);

      if (error) throw error;

      // Log the activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("lead_activities").insert({
          lead_id: lead.id,
          user_id: user.id,
          activity_type: "status_change",
          title: "Status Changed",
          description: `Status changed from ${lead.status} to ${newStatus}`,
        });
      }

      // Update local state
      setLead(prev => prev ? { ...prev, status: newStatus } : null);

      toast({
        title: "Success",
        description: "Lead status updated",
      });

      fetchActivities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading lead details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!lead) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate("/crm/leads")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Leads
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Lead Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Lead Header */}
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-3xl">{lead.client_name || "Unnamed Lead"}</CardTitle>
                      <Select value={lead.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="New Lead">New Lead</SelectItem>
                          <SelectItem value="Warm">Warm</SelectItem>
                          <SelectItem value="HOT">HOT</SelectItem>
                          <SelectItem value="Called Engaged">Called Engaged</SelectItem>
                          <SelectItem value="Called No Answer">Called No Answer</SelectItem>
                          <SelectItem value="Called Unanswer 2">Called Unanswer 2</SelectItem>
                          <SelectItem value="Called COLD">Called COLD</SelectItem>
                          <SelectItem value="No Connection">No Connection</SelectItem>
                          <SelectItem value="PROBLEM">PROBLEM</SelectItem>
                          <SelectItem value="SOLD">SOLD</SelectItem>
                          <SelectItem value="LOST">LOST</SelectItem>
                        </SelectContent>
                      </Select>
                      {lead.client_converted && (
                        <Badge variant="outline" className="bg-green-50">
                          ✓ Converted
                        </Badge>
                      )}
                      {lead.archived && (
                        <Badge variant="outline" className="bg-gray-100">
                          <Archive className="w-3 h-3 mr-1" />
                          Archived
                        </Badge>
                      )}
                      {lead.previously_lost && (
                        <PreviouslyLostBadge
                          lostBy={lostByUser}
                          lostAt={lead.lost_at}
                          lostReason={lead.lost_reason || undefined}
                        />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(lead.created_at).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleArchiveToggle}
                      title={lead.archived ? "Restore from archive" : "Archive this lead"}
                    >
                      {lead.archived ? (
                        <>
                          <ArchiveRestore className="w-4 h-4 mr-2" />
                          Restore
                        </>
                      ) : (
                        <>
                          <Archive className="w-4 h-4 mr-2" />
                          Archive
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setEditingLead(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    {isAdmin && (
                      <Button 
                        variant="destructive" 
                        onClick={() => setDeleteDialogOpen(true)}
                        title="Delete this lead permanently"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{lead.mobile_number}</p>
                      </div>
                    </div>
                    
                    {lead.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{lead.email}</p>
                        </div>
                      </div>
                    )}

                    {lead.emirate && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Emirate</p>
                          <p className="font-medium">{lead.emirate}</p>
                        </div>
                      </div>
                    )}

                    {lead.nationality_code && (
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Nationality</p>
                          <p className="font-medium">{lead.nationality_code}</p>
                        </div>
                      </div>
                    )}

                    {lead.service_required && (
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Service</p>
                          <p className="font-medium">{lead.service_required}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Remind Me</p>
                        <p className="font-medium">
                          {new Date(lead.remind_me).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {lead.visa_expiry_date && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Visa Expiry</p>
                          <p className="font-medium">
                            {new Date(lead.visa_expiry_date).toLocaleDateString('en-GB', { 
                              day: '2-digit', 
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Activity Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Activity */}
                  <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                    <div className="flex gap-2">
                      <Select value={activityType} onValueChange={setActivityType}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="note">Note</SelectItem>
                          <SelectItem value="call">Phone Call</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      placeholder="Add a note or log an activity..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                    />
                    <Button 
                      onClick={handleAddActivity} 
                      disabled={!newNote.trim() || addingActivity}
                      size="sm"
                    >
                      {addingActivity ? "Adding..." : "Add Activity"}
                    </Button>
                  </div>

                  {/* Activities List */}
                  <div className="space-y-4">
                    {activities.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No activities yet. Add your first note!
                      </p>
                    ) : (
                      activities.map((activity) => (
                        <div key={activity.id} className="flex gap-3 pb-4 border-b last:border-0">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {getActivityIcon(activity.activity_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm">{activity.title}</p>
                              <Badge variant="outline" className="text-xs">
                                {activity.activity_type}
                              </Badge>
                            </div>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">
                                {activity.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(activity.created_at).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {activity.profiles?.email && (
                                <>
                                  <span>•</span>
                                  <span>{activity.profiles.email.split('@')[0]}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Quick Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <Label htmlFor="hot-toggle" className="font-medium cursor-pointer">
                      🔥 Mark as HOT
                    </Label>
                    <Switch
                      id="hot-toggle"
                      checked={lead.hot || false}
                      onCheckedChange={handleHotToggle}
                    />
                  </div>

                  {/* Reminder Date Setter */}
                  <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                    <Label htmlFor="reminder-date" className="font-medium">
                      Set Reminder Date
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="reminder-date"
                        type="date"
                        value={reminderDate}
                        onChange={(e) => setReminderDate(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        size="sm"
                        onClick={handleUpdateReminder}
                        disabled={updatingReminder || !reminderDate || reminderDate === lead.remind_me}
                      >
                        {updatingReminder ? "Saving..." : "Save"}
                      </Button>
                    </div>
                    {lead.remind_me && (
                      <p className="text-xs text-muted-foreground">
                        Current: {new Date(lead.remind_me).toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={handleCall}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call Lead
                    </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={handleWhatsApp}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                  
                  {lead.email && (
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={handleEmail}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </Button>
                  )}

                    {!lead.client_converted && (
                      <Button
                        className="w-full justify-start"
                        onClick={() => navigate(`/start-here?lead_id=${lead.id}`)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Convert to Client
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <LostReasonDialog
        open={lostDialogOpen}
        onOpenChange={setLostDialogOpen}
        onConfirm={handleLostConfirm}
        leadName={lead?.client_name || "this lead"}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{lead?.client_name || 'this lead'}"? 
              This action cannot be undone and will remove all associated activities.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete Lead"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <QuickLeadEntry
        open={editingLead}
        lead={lead}
        onClose={() => setEditingLead(false)}
        onSuccess={() => {
          fetchLeadDetails();
          setEditingLead(false);
        }}
      />
    </Layout>
  );
};

export default LeadDetail;
