import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, TrendingUp, Users, UserPlus, PieChart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

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

const LeadAttendanceReport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [todayDate] = useState(new Date().toISOString().split('T')[0]);
  const [leadsAddedToday, setLeadsAddedToday] = useState(0);
  const [leadsUpdatedToday, setLeadsUpdatedToday] = useState(0);
  const [staffActivities, setStaffActivities] = useState<StaffActivity[]>([]);
  const [totalLeadsTaken, setTotalLeadsTaken] = useState(0);
  const [leadsBySource, setLeadsBySource] = useState<LeadSourceData[]>([]);

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
      setTotalLeadsTaken(activities.reduce((sum, a) => sum + a.leads_picked, 0));

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
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <CardTitle className="text-sm font-medium">Total Leads Taken</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{totalLeadsTaken}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Picked up by staff
              </p>
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

        {/* Lead by Source Chart */}
        <Card className="mb-8">
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
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leadsBySource}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="source" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    className="text-xs"
                  />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" name="Leads" radius={[8, 8, 0, 0]}>
                    {leadsBySource.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

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
    </Layout>
  );
};

export default LeadAttendanceReport;
