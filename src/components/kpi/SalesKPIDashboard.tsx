import { useSalesKPIs } from "@/hooks/useSalesKPIs";
import { KPICard } from "./KPICard";
import { LeadFunnelChart } from "./LeadFunnelChart";
import { PerformanceTrends } from "./PerformanceTrends";
import { TeamLeaderboard } from "./TeamLeaderboard";
import { DollarSign, Target, TrendingUp, Activity } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRole } from "@/hooks/useUserRole";

interface SalesKPIDashboardProps {
  userId?: string;
  showPeriodSelector?: boolean;
  showTeamLeaderboard?: boolean;
}

export const SalesKPIDashboard = ({ 
  userId, 
  showPeriodSelector = false,
  showTeamLeaderboard = false 
}: SalesKPIDashboardProps) => {
  const { kpis, isLoading, error } = useSalesKPIs(userId);
  const { role } = useUserRole();

  const isAdmin = role === 'admin';

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-2 w-full mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!kpis) {
    return (
      <Alert>
        <AlertDescription>
          No targets have been set for this period. Contact your manager to set up your KPIs.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {showPeriodSelector && (
        <div className="mb-4">
          {/* Period selector component can be added here */}
        </div>
      )}
      
      {/* Main KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Revenue"
          icon={DollarSign}
          target={kpis.revenueTarget}
          actual={kpis.revenueActual}
          progress={kpis.revenueProgress}
          unit=" AED"
          color="text-green-600"
          tier={kpis.revenueTier.level}
          gap={kpis.gap.revenueGap}
          dailyNeeded={kpis.pacing.dailyRevenueNeeded}
          projected={kpis.pacing.projectedRevenue}
        />
        <KPICard
          title="Deals Closed"
          icon={Target}
          target={kpis.dealsTarget}
          actual={kpis.dealsActual}
          progress={kpis.dealsProgress}
          color="text-blue-600"
          tier={kpis.dealsTier.level}
          gap={kpis.gap.dealsGap}
          dailyNeeded={kpis.pacing.dailyDealsNeeded}
          projected={kpis.pacing.projectedDeals}
        />
        <KPICard
          title="Conversion Rate"
          icon={TrendingUp}
          target={kpis.conversionTarget}
          actual={kpis.conversionActual}
          progress={kpis.conversionProgress}
          unit="%"
          color="text-purple-600"
          tier={kpis.conversionTier.level}
          gap={kpis.gap.conversionGap}
        />
        <KPICard
          title="Activity Count"
          icon={Activity}
          target={kpis.activityTarget}
          actual={kpis.activityActual}
          progress={kpis.activityProgress}
          color="text-orange-600"
          tier={kpis.activityTier.level}
          gap={kpis.gap.activityGap}
          dailyNeeded={kpis.pacing.dailyActivityNeeded}
          projected={kpis.pacing.projectedActivity}
        />
      </div>

      {/* Secondary Analytics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <LeadFunnelChart metrics={kpis.leadMetrics} />
        <PerformanceTrends trends={kpis.trends} />
        {(showTeamLeaderboard || isAdmin) && <TeamLeaderboard />}
      </div>
    </div>
  );
};
