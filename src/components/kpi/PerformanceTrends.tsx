import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { TrendData } from "@/hooks/useSalesKPIs";

interface PerformanceTrendsProps {
  trends: TrendData;
}

export const PerformanceTrends = ({ trends }: PerformanceTrendsProps) => {
  const getTrendIcon = (change: number) => {
    if (change > 5) return <TrendingUp className="text-green-600" size={16} />;
    if (change < -5) return <TrendingDown className="text-red-600" size={16} />;
    return <Minus className="text-muted-foreground" size={16} />;
  };

  const getTrendColor = (change: number) => {
    if (change > 5) return "text-green-600";
    if (change < -5) return "text-red-600";
    return "text-muted-foreground";
  };

  const metrics = [
    {
      label: "Revenue",
      current: trends.currentWeek.revenue,
      last: trends.lastWeek.revenue,
      change: trends.weekOverWeek.revenueChange,
      unit: "AED",
      format: (val: number) => val.toLocaleString(),
    },
    {
      label: "Deals",
      current: trends.currentWeek.deals,
      last: trends.lastWeek.deals,
      change: trends.weekOverWeek.dealsChange,
      unit: "",
      format: (val: number) => val.toString(),
    },
    {
      label: "Conversion",
      current: trends.currentWeek.conversion,
      last: trends.lastWeek.conversion,
      change: trends.weekOverWeek.conversionChange,
      unit: "%",
      format: (val: number) => val.toFixed(1),
    },
    {
      label: "Activities",
      current: trends.currentWeek.activities,
      last: trends.lastWeek.activities,
      change: trends.weekOverWeek.activitiesChange,
      unit: "",
      format: (val: number) => val.toString(),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Week-over-Week Trends</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{metric.label}</span>
              <div className="flex items-center gap-2">
                {getTrendIcon(metric.change)}
                <span className={`text-xs font-medium ${getTrendColor(metric.change)}`}>
                  {metric.change > 0 ? "+" : ""}{metric.change.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-xs text-muted-foreground">This Week</p>
                <p className="font-medium">
                  {metric.format(metric.current)}{metric.unit}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Last Week</p>
                <p className="font-medium text-muted-foreground">
                  {metric.format(metric.last)}{metric.unit}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
