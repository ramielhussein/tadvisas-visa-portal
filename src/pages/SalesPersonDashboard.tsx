import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Target, TrendingUp, Calendar, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { format, differenceInDays } from "date-fns";

interface SalesTarget {
  id: string;
  revenue_target: number;
  deals_target: number;
  period_start: string;
  period_end: string;
  period_type: string;
}

interface SalesPerformance {
  total_deals: number;
  total_revenue: number;
  closed_deals: number;
}

export default function SalesPersonDashboard() {
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<SalesTarget | null>(null);
  const [performance, setPerformance] = useState<SalesPerformance>({
    total_deals: 0,
    total_revenue: 0,
    closed_deals: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Please log in to view your dashboard",
          variant: "destructive",
        });
        return;
      }

      // Get current active target
      const today = new Date().toISOString().split('T')[0];
      const { data: targetData, error: targetError } = await supabase
        .from('sales_targets')
        .select('*')
        .eq('user_id', user.id)
        .lte('period_start', today)
        .gte('period_end', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (targetError) throw targetError;
      setTarget(targetData);

      if (targetData) {
        // Get performance data for current period
        const { data: dealsData, error: dealsError } = await supabase
          .from('deals')
          .select('total_amount, status')
          .eq('assigned_to', user.id)
          .gte('created_at', targetData.period_start)
          .lte('created_at', targetData.period_end);

        if (dealsError) throw dealsError;

        const totalDeals = dealsData?.length || 0;
        const closedDeals = dealsData?.filter(d => d.status === 'Closed').length || 0;
        const totalRevenue = dealsData
          ?.filter(d => d.status === 'Closed')
          ?.reduce((sum, d) => sum + (d.total_amount || 0), 0) || 0;

        setPerformance({
          total_deals: totalDeals,
          total_revenue: totalRevenue,
          closed_deals: closedDeals,
        });
      }
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateBurnRate = () => {
    if (!target) return { daysGone: 0, totalDays: 0, burnRate: 0 };
    
    const start = new Date(target.period_start);
    const end = new Date(target.period_end);
    const today = new Date();
    
    const totalDays = differenceInDays(end, start) + 1;
    const daysGone = differenceInDays(today, start) + 1;
    const burnRate = (daysGone / totalDays) * 100;
    
    return { daysGone, totalDays, burnRate: Math.min(burnRate, 100) };
  };

  const calculateTargetProgress = (achieved: number, target: number) => {
    return target > 0 ? (achieved / target) * 100 : 0;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!target) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle>No Active Sales Target</CardTitle>
              <CardDescription>
                You don't have any active sales targets for the current period. Contact your manager to set up targets.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }

  const { daysGone, totalDays, burnRate } = calculateBurnRate();
  const revenueProgress = calculateTargetProgress(performance.total_revenue, target.revenue_target);
  const dealsProgress = calculateTargetProgress(performance.closed_deals, target.deals_target);

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sales Dashboard</h1>
            <p className="text-muted-foreground">
              Period: {format(new Date(target.period_start), 'MMM dd, yyyy')} - {format(new Date(target.period_end), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>

        {/* Time Burn Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Period Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Days Elapsed</span>
              <span className="font-semibold">{daysGone} / {totalDays} days</span>
            </div>
            <Progress value={burnRate} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {burnRate.toFixed(1)}% of the period has passed
            </p>
          </CardContent>
        </Card>

        {/* Revenue Target */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Target
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Achieved</p>
                <p className="text-2xl font-bold">
                  AED {performance.total_revenue.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Target</p>
                <p className="text-2xl font-bold">
                  AED {target.revenue_target.toLocaleString()}
                </p>
              </div>
            </div>
            <Progress value={revenueProgress} className="h-3" />
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-primary">
                {revenueProgress.toFixed(1)}% achieved
              </span>
              <span className="text-muted-foreground">
                AED {(target.revenue_target - performance.total_revenue).toLocaleString()} remaining
              </span>
            </div>
            
            {/* Pace Indicator */}
            {burnRate > 0 && (
              <div className={`p-3 rounded-lg ${
                revenueProgress >= burnRate 
                  ? 'bg-green-500/10 text-green-600' 
                  : 'bg-yellow-500/10 text-yellow-600'
              }`}>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {revenueProgress >= burnRate 
                      ? `On track! You're ${(revenueProgress - burnRate).toFixed(1)}% ahead of schedule`
                      : `Behind pace by ${(burnRate - revenueProgress).toFixed(1)}%`
                    }
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deals Target */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Deals Target
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Closed Deals</p>
                <p className="text-2xl font-bold">{performance.closed_deals}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Target</p>
                <p className="text-2xl font-bold">{target.deals_target}</p>
              </div>
            </div>
            <Progress value={dealsProgress} className="h-3" />
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-primary">
                {dealsProgress.toFixed(1)}% achieved
              </span>
              <span className="text-muted-foreground">
                {target.deals_target - performance.closed_deals} deals remaining
              </span>
            </div>

            {/* Pace Indicator */}
            {burnRate > 0 && (
              <div className={`p-3 rounded-lg ${
                dealsProgress >= burnRate 
                  ? 'bg-green-500/10 text-green-600' 
                  : 'bg-yellow-500/10 text-yellow-600'
              }`}>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {dealsProgress >= burnRate 
                      ? `On track! You're ${(dealsProgress - burnRate).toFixed(1)}% ahead of schedule`
                      : `Behind pace by ${(burnRate - dealsProgress).toFixed(1)}%`
                    }
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{performance.total_deals}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {performance.closed_deals} closed, {performance.total_deals - performance.closed_deals} in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {performance.total_deals > 0 
                  ? ((performance.closed_deals / performance.total_deals) * 100).toFixed(1)
                  : '0'}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Deals won to total deals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Deal Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                AED {performance.closed_deals > 0 
                  ? (performance.total_revenue / performance.closed_deals).toLocaleString(undefined, { maximumFractionDigits: 0 })
                  : '0'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Per closed deal
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
