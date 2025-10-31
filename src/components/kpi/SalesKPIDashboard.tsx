import { useSalesKPIs } from "@/hooks/useSalesKPIs";
import { KPICard } from "./KPICard";
import { DollarSign, Target, TrendingUp, Phone } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SalesKPIDashboardProps {
  userId?: string;
  showPeriodSelector?: boolean;
}

export const SalesKPIDashboard = ({ userId, showPeriodSelector = false }: SalesKPIDashboardProps) => {
  const { kpis, isLoading, error } = useSalesKPIs(userId);

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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Your Performance</h2>
          <p className="text-sm text-muted-foreground">
            Period: {new Date(kpis.periodStart).toLocaleDateString()} - {new Date(kpis.periodEnd).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Revenue"
          icon={DollarSign}
          target={kpis.revenueTarget}
          actual={kpis.revenueActual}
          progress={kpis.revenueProgress}
          unit=" AED"
          color="text-green-600"
        />
        
        <KPICard
          title="Deals Closed"
          icon={Target}
          target={kpis.dealsTarget}
          actual={kpis.dealsActual}
          progress={kpis.dealsProgress}
          color="text-blue-600"
        />
        
        <KPICard
          title="Conversion Rate"
          icon={TrendingUp}
          target={kpis.conversionTarget}
          actual={kpis.conversionActual}
          progress={kpis.conversionProgress}
          unit="%"
          color="text-purple-600"
        />
        
        <KPICard
          title="Activity Count"
          icon={Phone}
          target={kpis.activityTarget}
          actual={kpis.activityActual}
          progress={kpis.activityProgress}
          color="text-orange-600"
        />
      </div>
    </div>
  );
};
