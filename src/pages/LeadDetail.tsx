import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import Layout from "@/components/Layout";
import EditLeadDialog, { Lead } from "@/components/crm/EditLeadDialog";
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
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    if (id) {
      fetchLeadDetails();
      fetchActivities();
    }
  }, [id]);

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
        navigate("/lead-management");
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
      const { data, error } = await supabase
        .from("lead_activities")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch user emails separately
      if (data) {
        const activitiesWithProfiles = await Promise.all(
          data.map(async (activity) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", activity.user_id)
              .maybeSingle();
            
            return {
              ...activity,
              profiles: profile || undefined,
            };
          })
        );
        setActivities(activitiesWithProfiles as Activity[]);
      }
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
      "New Lead": "bg-blue-500 text-white",
      "Called Engaged": "bg-blue-500 text-white",
      "Called No Answer": "bg-pink-500 text-white",
      "Called COLD": "bg-red-600 text-white",
      "Warm": "bg-red-300 text-white",
      "HOT": "bg-orange-600 text-white",
      "SOLD": "bg-green-500 text-white",
      "LOST": "bg-red-600 text-white",
      "PROBLEM": "bg-black text-white",
    };
    return colors[status] || "bg-gray-500 text-white";
  };

  const handleWhatsApp = () => {
    if (lead?.mobile_number) {
      const cleanNumber = lead.mobile_number.replace(/[^\d+]/g, '');
      window.open(`https://wa.me/${cleanNumber}`, '_blank');
    }
  };

  const handleCall = () => {
    if (lead?.mobile_number) {
      window.location.href = `tel:${lead.mobile_number}`;
    }
  };

  const handleEmail = () => {
    if (lead?.email) {
      window.location.href = `mailto:${lead.email}`;
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
            <Button variant="ghost" onClick={() => navigate("/lead-management")}>
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
                      <Badge className={cn("text-xs", getStatusColor(lead.status))}>
                        {lead.status}
                      </Badge>
                      {lead.client_converted && (
                        <Badge variant="outline" className="bg-green-50">
                          ✓ Converted
                        </Badge>
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
                  <Button variant="outline" onClick={() => setEditingLead(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
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
                <CardContent className="space-y-2">
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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <EditLeadDialog
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
