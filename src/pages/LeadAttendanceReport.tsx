import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, TrendingUp, Users, UserPlus, PieChart, Download, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart as RechartsPieChart, Pie, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import html2pdf from "html2pdf.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StaffActivity {
  staff_id: string;
  staff_name: string;
  staff_email: string;
  leads_picked: number;
  leads_updated: number;
  total_activity: number;
}

interface LeadSourceData {
  source: string;
  count: number;
}

interface LeadServiceData {
  service: string;
  count: number;
}

const LeadAttendanceReport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [todayDate] = useState(new Date().toISOString().split('T')[0]);
  const [leadsAddedToday, setLeadsAddedToday] = useState(0);
  const [leadsUpdatedToday, setLeadsUpdatedToday] = useState(0);
  const [staffActivities, setStaffActivities] = useState<StaffActivity[]>([]);
  const [totalLeadsTaken, setTotalLeadsTaken] = useState(0);
  const [freshLeadsTaken, setFreshLeadsTaken] = useState(0);
  const [leadsBySource, setLeadsBySource] = useState<LeadSourceData[]>([]);
  const [leadsByService, setLeadsByService] = useState<LeadServiceData[]>([]);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);

      // Get today's start and end timestamps
      const startOfDay = `${todayDate}T00:00:00`;
      const endOfDay = `${todayDate}T23:59:59`;

      // Fetch all leads created today
      const { data: createdToday, error: createdError } = await supabase
        .from("leads")
        .select("id")
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay);

      if (createdError) throw createdError;
      setLeadsAddedToday(createdToday?.length || 0);

      // Fetch all leads updated today (but not created today)
      const { data: updatedToday, error: updatedError } = await supabase
        .from("leads")
        .select("id")
        .gte("updated_at", startOfDay)
        .lte("updated_at", endOfDay)
        .lt("created_at", startOfDay);

      if (updatedError) throw updatedError;
      setLeadsUpdatedToday(updatedToday?.length || 0);

      // Fetch leads assigned to staff today (taken by staff)
      const { data: assignedLeads, error: assignedError } = await supabase
        .from("leads")
        .select("assigned_to")
        .not("assigned_to", "is", null)
        .or(`created_at.gte.${startOfDay},updated_at.gte.${startOfDay}`)
        .lte("created_at", endOfDay)
        .lte("updated_at", endOfDay);

      if (assignedError) throw assignedError;

      // Count leads per staff member
      const staffMap = new Map<string, { picked: number; updated: number }>();
      
      for (const lead of assignedLeads || []) {
        if (!lead.assigned_to) continue;
        
        const existing = staffMap.get(lead.assigned_to) || { picked: 0, updated: 0 };
        staffMap.set(lead.assigned_to, existing);
      }

      // Now fetch created and updated separately for accurate counting
      const { data: pickedLeads, error: pickedError } = await supabase
        .from("leads")
        .select("assigned_to, created_at")
        .not("assigned_to", "is", null)
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay);

      if (pickedError) throw pickedError;

      const { data: touchedLeads, error: touchedError } = await supabase
        .from("leads")
        .select("assigned_to, updated_at, created_at")
        .not("assigned_to", "is", null)
        .gte("updated_at", startOfDay)
        .lte("updated_at", endOfDay)
        .lt("created_at", startOfDay);

      if (touchedError) throw touchedError;

      // Reset the map for accurate counting
      staffMap.clear();

      for (const lead of pickedLeads || []) {
        if (!lead.assigned_to) continue;
        const existing = staffMap.get(lead.assigned_to) || { picked: 0, updated: 0 };
        existing.picked++;
        staffMap.set(lead.assigned_to, existing);
      }

      for (const lead of touchedLeads || []) {
        if (!lead.assigned_to) continue;
        const existing = staffMap.get(lead.assigned_to) || { picked: 0, updated: 0 };
        existing.updated++;
        staffMap.set(lead.assigned_to, existing);
      }

      // Fetch staff profiles
      const staffIds = Array.from(staffMap.keys());
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", staffIds);

      if (profilesError) throw profilesError;

      // Build staff activities array
      const activities: StaffActivity[] = staffIds.map(staffId => {
        const profile = profiles?.find(p => p.id === staffId);
        const counts = staffMap.get(staffId) || { picked: 0, updated: 0 };
        
        return {
          staff_id: staffId,
          staff_name: profile?.full_name || "Unknown",
          staff_email: profile?.email || "",
          leads_picked: counts.picked,
          leads_updated: counts.updated,
          total_activity: counts.picked + counts.updated,
        };
      });

      // Sort by total activity descending
      activities.sort((a, b) => b.total_activity - a.total_activity);

      setStaffActivities(activities);
      
      // Fresh leads taken - only new leads created today with assignment
      const freshTaken = activities.reduce((sum, a) => sum + a.leads_picked, 0);
      setFreshLeadsTaken(freshTaken);
      
      // Total leads taken - all leads with assignment activity today
      setTotalLeadsTaken(assignedLeads?.length || 0);

      // Fetch leads by source for today
      const { data: leadsWithSource, error: sourceError } = await supabase
        .from("leads")
        .select("lead_source")
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay);

      if (sourceError) throw sourceError;

      // Group by source
      const sourceMap = new Map<string, number>();
      for (const lead of leadsWithSource || []) {
        const source = lead.lead_source || "No Source";
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
      }

      const sourceData: LeadSourceData[] = Array.from(sourceMap.entries())
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count);

      setLeadsBySource(sourceData);

      // Fetch leads by service for today
      const { data: leadsWithService, error: serviceError } = await supabase
        .from("leads")
        .select("service_required")
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay);

      if (serviceError) throw serviceError;

      // Group by service
      const serviceMap = new Map<string, number>();
      for (const lead of leadsWithService || []) {
        const service = lead.service_required || "No Service";
        serviceMap.set(service, (serviceMap.get(service) || 0) + 1);
      }

      const serviceData: LeadServiceData[] = Array.from(serviceMap.entries())
        .map(([service, count]) => ({ service, count }))
        .sort((a, b) => b.count - a.count);

      setLeadsByService(serviceData);

    } catch (error: any) {
      console.error("Error fetching attendance data:", error);
      toast({
        title: "Error",
        description: "Failed to load lead attendance report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    // Add PDF-specific class to optimize layout
    element.classList.add('pdf-export');

    const opt = {
      margin: 5,
      filename: `lead-attendance-report-${todayDate}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.95 },
      html2canvas: { scale: 1.5 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    try {
      await html2pdf().set(opt).from(element).save();
      toast({
        title: "Success",
        description: "Report downloaded successfully",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      // Remove PDF class after generation
      element.classList.remove('pdf-export');
    }
  };

  const handleScheduleEmail = async () => {
    // Display current schedule information
    toast({
      title: "Email Schedule Active",
      description: "Daily reports are automatically sent at 8:00 AM UAE time to sales1@tadmaids.com, rami@tadmaids.com, nour@tadmaids.com, and nawar@tadmaids.com",
      duration: 8000,
    });
    
    setEmailDialogOpen(false);
  };

  const handleTestEmail = async () => {
    try {
      toast({
        title: "Sending Email",
        description: "Please wait...",
      });
      
      const { data, error } = await supabase.functions.invoke('send-daily-report-email');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Test email sent successfully! Check your inbox.",
      });
      console.log("Email sent:", data);
    } catch (error: any) {
      console.error("Error sending test email:", error);
      toast({
        title: "Error",
        description: "Failed to send test email: " + error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Lead Attendance Report</h1>
              <p className="text-muted-foreground mt-1">
                Daily activity tracking - {new Date(todayDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDownloadPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handleTestEmail}>
              <Mail className="h-4 w-4 mr-2" />
              Test Email Now
            </Button>
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Email Schedule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Email Schedule Status</DialogTitle>
                  <DialogDescription>
                    Current configuration for automated daily report emails
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Email Recipients</Label>
                    <div className="text-sm bg-muted p-3 rounded-md">
                      <p>• sales1@tadmaids.com</p>
                      <p>• rami@tadmaids.com</p>
                      <p>• nour@tadmaids.com</p>
                      <p>• nawar@tadmaids.com</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Delivery Time</Label>
                    <div className="text-sm bg-muted p-3 rounded-md">
                      8:00 AM UAE Time (Daily)
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500">Active</Badge>
                      <span className="text-xs text-muted-foreground">
                        Automated emails are running
                      </span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setEmailDialogOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div id="report-content" className="relative">
        <style>{`
          #report-content {
            font-size: 12px;
          }
          #report-content .card-header {
            padding: 12px;
          }
          #report-content .card-content {
            padding: 12px;
          }
          #report-content h3 {
            font-size: 14px;
          }
          #report-content .text-2xl {
            font-size: 20px;
          }
          #report-content table {
            font-size: 11px;
          }
          #report-content td, #report-content th {
            padding: 6px 8px;
          }
          #report-content.pdf-export {
            font-size: 10px;
          }
          #report-content.pdf-export .card-header {
            padding: 8px;
          }
          #report-content.pdf-export .card-content {
            padding: 8px;
          }
          #report-content.pdf-export h3 {
            font-size: 12px;
          }
          #report-content.pdf-export .text-2xl {
            font-size: 16px;
          }
          #report-content.pdf-export table {
            font-size: 9px;
          }
          #report-content.pdf-export td, #report-content.pdf-export th {
            padding: 4px 6px;
          }
        `}</style>

        {/* Report Header */}
        <div className="mb-6 text-center border-b pb-4">
          <h2 className="text-3xl font-bold mb-2">Lead Attendance Report</h2>
          <p className="text-lg text-muted-foreground">
            {new Date(todayDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Added Today</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{leadsAddedToday}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                New leads created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Updated Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{leadsUpdatedToday}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Existing leads touched
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fresh Leads Taken</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{freshLeadsTaken}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {leadsAddedToday > 0 
                      ? `${((freshLeadsTaken / leadsAddedToday) * 100).toFixed(1)}% of new leads`
                      : 'No new leads'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads Taken</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalLeadsTaken}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {leadsAddedToday + leadsUpdatedToday > 0 
                      ? `${((totalLeadsTaken / (leadsAddedToday + leadsUpdatedToday)) * 100).toFixed(1)}% of all leads`
                      : 'No leads to calculate'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{staffActivities.length}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                With activity today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Lead by Source Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Leads by Source
              </CardTitle>
              <CardDescription>
                Breakdown of today's leads by their source
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : leadsBySource.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No leads added today</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <RechartsPieChart>
                    <Pie
                      data={leadsBySource}
                      dataKey="count"
                      nameKey="source"
                      cx="30%"
                      cy="50%"
                      outerRadius={60}
                      label={({ source, count, percent }) => 
                        `${source}: ${count} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1 }}
                      style={{ fontSize: '10px' }}
                    >
                      {leadsBySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '11px'
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Lead by Service Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Services Needed
              </CardTitle>
              <CardDescription>
                Breakdown of today's leads by service type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : leadsByService.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No leads added today</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <RechartsPieChart>
                    <Pie
                      data={leadsByService}
                      dataKey="count"
                      nameKey="service"
                      cx="30%"
                      cy="50%"
                      outerRadius={60}
                      label={({ service, count, percent }) => 
                        `${service}: ${count} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1 }}
                      style={{ fontSize: '10px' }}
                    >
                      {leadsByService.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '11px'
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Staff Activity Table */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Activity Breakdown</CardTitle>
            <CardDescription>
              Detailed view of each staff member's lead activity for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : staffActivities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No staff activity recorded today</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Staff Member</TableHead>
                    <TableHead className="text-right">Leads Picked</TableHead>
                    <TableHead className="text-right">Leads Updated</TableHead>
                    <TableHead className="text-right">Total Activity</TableHead>
                    <TableHead className="text-center">Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffActivities.map((activity, index) => (
                    <TableRow key={activity.staff_id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{activity.staff_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {activity.staff_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="font-mono">
                          {activity.leads_picked}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="font-mono">
                          {activity.leads_updated}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="font-mono">
                          {activity.total_activity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {activity.total_activity >= 10 ? (
                          <Badge className="bg-green-500">Excellent</Badge>
                        ) : activity.total_activity >= 5 ? (
                          <Badge className="bg-blue-500">Good</Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </Layout>
  );
};

export default LeadAttendanceReport;
