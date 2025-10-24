import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import Layout from "@/components/Layout";
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  Target,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Trophy,
  TrendingDown
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList } from "recharts";

interface Lead {
  id: string;
  client_name: string;
  mobile_number: string;
  status: string;
  remind_me: string;
  lead_source: string | null;
}

interface SalesPerformance {
  assigned_to: string;
  new_leads: number;
  warm_leads: number;
  hot_leads: number;
  sold_leads: number;
  lost_leads: number;
  total_leads: number;
  conversion_rate: number;
  email?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdminCheck();
  
  const [loading, setLoading] = useState(true);
  const [overdueLeads, setOverdueLeads] = useState<Lead[]>([]);
  const [dueTodayLeads, setDueTodayLeads] = useState<Lead[]>([]);
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [salesPerformance, setSalesPerformance] = useState<SalesPerformance[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchReminders(),
        fetchLeadSources(),
        fetchFunnelData(),
        fetchSalesPerformance(),
      ]);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReminders = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: overdue } = await supabase
      .from("leads")
      .select("id, client_name, mobile_number, status, remind_me, lead_source")
      .lt("remind_me", today)
      .neq("status", "SOLD")
      .neq("status", "LOST")
      .order("remind_me", { ascending: true })
      .limit(10);

    const { data: dueToday } = await supabase
      .from("leads")
      .select("id, client_name, mobile_number, status, remind_me, lead_source")
      .eq("remind_me", today)
      .neq("status", "SOLD")
      .neq("status", "LOST")
      .order("created_at", { ascending: false });

    setOverdueLeads(overdue || []);
    setDueTodayLeads(dueToday || []);
  };

  const fetchLeadSources = async () => {
    const { data } = await supabase
      .from("leads")
      .select("lead_source");

    if (data) {
      const sourceCounts: Record<string, number> = {};
      data.forEach(lead => {
        const source = lead.lead_source || "Unknown";
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      });

      const chartData = Object.entries(sourceCounts).map(([name, value]) => ({
        name,
        value,
      }));

      setSourceData(chartData);
    }
  };

  const fetchFunnelData = async () => {
    const statuses: Array<"New Lead" | "Warm" | "HOT" | "SOLD"> = ["New Lead", "Warm", "HOT", "SOLD"];
    const counts = await Promise.all(
      statuses.map(async (status) => {
        const { count } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("status", status);
        return { name: status, value: count || 0 };
      })
    );

    setFunnelData(counts);
  };

  const fetchSalesPerformance = async () => {
    if (!isAdmin) return;

    const { data } = await supabase
      .from("sales_performance")
      .select("*");

    if (data) {
      // Fetch user emails
      const userIds = data.map(d => d.assigned_to);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.email]));

      const enriched = data.map(perf => ({
        ...perf,
        email: profileMap.get(perf.assigned_to) || "Unknown",
      }));

      setSalesPerformance(enriched.sort((a, b) => b.sold_leads - a.sold_leads));
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">CRM Dashboard</h1>
            <Button onClick={() => navigate("/crm/leads")}>
              View All Leads
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Follow-up Reminders Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Overdue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  Overdue Follow-ups ({overdueLeads.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overdueLeads.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No overdue follow-ups! 🎉
                  </p>
                ) : (
                  <div className="space-y-3">
                    {overdueLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg cursor-pointer hover:bg-destructive/20"
                        onClick={() => navigate(`/crm/leads/${lead.id}`)}
                      >
                        <div>
                          <p className="font-medium">{lead.client_name || "Unnamed"}</p>
                          <p className="text-sm text-muted-foreground">{lead.mobile_number}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive" className="mb-1">
                            {new Date(lead.remind_me).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </Badge>
                          <p className="text-xs text-muted-foreground">{lead.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Due Today */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Due Today ({dueTodayLeads.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dueTodayLeads.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No follow-ups due today
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dueTodayLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-center justify-between p-3 bg-primary/10 rounded-lg cursor-pointer hover:bg-primary/20"
                        onClick={() => navigate(`/crm/leads/${lead.id}`)}
                      >
                        <div>
                          <p className="font-medium">{lead.client_name || "Unnamed"}</p>
                          <p className="text-sm text-muted-foreground">{lead.mobile_number}</p>
                        </div>
                        <Badge variant="outline">{lead.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Lead Source Tracking */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Lead Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sourceData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No lead source data available
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {sourceData.map((source, index) => (
                      <div key={source.name} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{source.name}</span>
                        </div>
                        <span className="text-muted-foreground">{source.value} leads</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Conversion Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-4 gap-4 mt-4">
                {funnelData.map((stage, index) => {
                  const nextStage = funnelData[index + 1];
                  const dropRate = nextStage 
                    ? ((stage.value - nextStage.value) / stage.value * 100).toFixed(1)
                    : null;
                  
                  return (
                    <div key={stage.name} className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{stage.value}</p>
                      <p className="text-sm text-muted-foreground">{stage.name}</p>
                      {dropRate && (
                        <p className="text-xs text-destructive mt-1">
                          <TrendingDown className="w-3 h-3 inline" /> {dropRate}% drop
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Sales Performance - Admin Only */}
          {isAdmin && salesPerformance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Sales Team Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesPerformance.map((perf, index) => (
                    <div
                      key={perf.assigned_to}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{perf.email}</p>
                          <p className="text-sm text-muted-foreground">{perf.total_leads} total leads</p>
                        </div>
                      </div>
                      <div className="flex gap-4 items-center">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{perf.sold_leads}</p>
                          <p className="text-xs text-muted-foreground">Sold</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">{perf.lost_leads}</p>
                          <p className="text-xs text-muted-foreground">Lost</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{perf.conversion_rate || 0}%</p>
                          <p className="text-xs text-muted-foreground">Conv. Rate</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
