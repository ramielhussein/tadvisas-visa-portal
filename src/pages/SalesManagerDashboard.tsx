import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Users, TrendingUp, Target, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { format, differenceInDays } from "date-fns";

interface SalesTeamMember {
  user_id: string;
  full_name: string;
  email: string;
  target_revenue: number;
  target_deals: number;
  achieved_revenue: number;
  closed_deals: number;
  total_deals: number;
  period_start: string;
  period_end: string;
}

export default function SalesManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<SalesTeamMember[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Get all active targets for current period
      const { data: targetsData, error: targetsError } = await supabase
        .from('sales_targets')
        .select('*, profiles!sales_targets_user_id_fkey(id, full_name, email)')
        .lte('period_start', today)
        .gte('period_end', today)
        .order('created_at', { ascending: false });

      if (targetsError) throw targetsError;

      // Get performance for each user
      const teamPerformance: SalesTeamMember[] = [];
      
      for (const target of targetsData || []) {
        const { data: dealsData } = await supabase
          .from('deals')
          .select('total_amount, status')
          .eq('assigned_to', target.user_id)
          .gte('created_at', target.period_start)
          .lte('created_at', target.period_end);

        const totalDeals = dealsData?.length || 0;
        const closedDeals = dealsData?.filter(d => d.status === 'Closed').length || 0;
        const achievedRevenue = dealsData
          ?.filter(d => d.status === 'Closed')
          ?.reduce((sum, d) => sum + (d.total_amount || 0), 0) || 0;

        teamPerformance.push({
          user_id: target.user_id,
          full_name: (target.profiles as any)?.full_name || (target.profiles as any)?.email || 'Unknown',
          email: (target.profiles as any)?.email || '',
          target_revenue: target.revenue_target,
          target_deals: target.deals_target,
          achieved_revenue: achievedRevenue,
          closed_deals: closedDeals,
          total_deals: totalDeals,
          period_start: target.period_start,
          period_end: target.period_end,
        });
      }

      setTeamData(teamPerformance);
    } catch (error: any) {
      console.error('Error loading team data:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (achieved: number, target: number) => {
    return target > 0 ? (achieved / target) * 100 : 0;
  };

  const calculateBurnRate = (periodStart: string, periodEnd: string) => {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const today = new Date();
    
    const totalDays = differenceInDays(end, start) + 1;
    const daysGone = differenceInDays(today, start) + 1;
    
    return (daysGone / totalDays) * 100;
  };

  const teamTotals = teamData.reduce(
    (acc, member) => ({
      targetRevenue: acc.targetRevenue + member.target_revenue,
      achievedRevenue: acc.achievedRevenue + member.achieved_revenue,
      targetDeals: acc.targetDeals + member.target_deals,
      closedDeals: acc.closedDeals + member.closed_deals,
    }),
    { targetRevenue: 0, achievedRevenue: 0, targetDeals: 0, closedDeals: 0 }
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sales Team Dashboard</h1>
            <p className="text-muted-foreground">
              Current period performance overview
            </p>
          </div>
        </div>

        {/* Team Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{teamData.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Team Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {calculateProgress(teamTotals.achievedRevenue, teamTotals.targetRevenue).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                AED {teamTotals.achievedRevenue.toLocaleString()} / {teamTotals.targetRevenue.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Team Deals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {calculateProgress(teamTotals.closedDeals, teamTotals.targetDeals).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {teamTotals.closedDeals} / {teamTotals.targetDeals} closed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Avg Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {teamData.length > 0
                  ? (teamData.reduce((sum, m) => sum + calculateProgress(m.achieved_revenue, m.target_revenue), 0) / teamData.length).toFixed(1)
                  : '0'}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Team average
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Individual Performance */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Individual Performance</h2>
          {teamData.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Active Targets</CardTitle>
                <CardDescription>
                  No sales targets are configured for the current period.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            teamData.map((member) => {
              const revenueProgress = calculateProgress(member.achieved_revenue, member.target_revenue);
              const dealsProgress = calculateProgress(member.closed_deals, member.target_deals);
              const burnRate = calculateBurnRate(member.period_start, member.period_end);
              const isOnTrack = revenueProgress >= burnRate;

              return (
                <Card key={member.user_id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{member.full_name}</CardTitle>
                        <CardDescription>{member.email}</CardDescription>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isOnTrack 
                          ? 'bg-green-500/10 text-green-600' 
                          : 'bg-yellow-500/10 text-yellow-600'
                      }`}>
                        {isOnTrack ? 'On Track' : 'Behind'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Revenue */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Revenue</span>
                        <span className="text-muted-foreground">
                          AED {member.achieved_revenue.toLocaleString()} / {member.target_revenue.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={revenueProgress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{revenueProgress.toFixed(1)}% achieved</span>
                        <span>Burn rate: {burnRate.toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* Deals */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Deals</span>
                        <span className="text-muted-foreground">
                          {member.closed_deals} / {member.target_deals} closed
                        </span>
                      </div>
                      <Progress value={dealsProgress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{dealsProgress.toFixed(1)}% achieved</span>
                        <span>{member.total_deals} total deals</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
