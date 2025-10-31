import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, UserCheck, UserX } from "lucide-react";
import { LeadMetrics } from "@/hooks/useSalesKPIs";

interface LeadFunnelChartProps {
  metrics: LeadMetrics;
}

export const LeadFunnelChart = ({ metrics }: LeadFunnelChartProps) => {
  const stages = [
    { label: "Total Leads", value: metrics.totalLeads, icon: Users, color: "bg-blue-500" },
    { label: "New", value: metrics.newLeads, icon: Users, color: "bg-gray-500" },
    { label: "Warm", value: metrics.warmLeads, icon: TrendingUp, color: "bg-yellow-500" },
    { label: "Hot", value: metrics.hotLeads, icon: TrendingUp, color: "bg-orange-500" },
    { label: "Sold", value: metrics.soldLeads, icon: UserCheck, color: "bg-green-500" },
    { label: "Lost", value: metrics.lostLeads, icon: UserX, color: "bg-red-500" },
  ];

  const maxValue = metrics.totalLeads || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Lead Funnel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const percentage = (stage.value / maxValue) * 100;
          
          return (
            <div key={stage.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">{stage.label}</span>
                </div>
                <span className="font-medium">{stage.value}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full ${stage.color} transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
        
        <div className="pt-3 border-t space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Avg Deal Size:</span>
            <span className="font-medium">AED {metrics.averageDealSize.toLocaleString()}</span>
          </div>
          
          {Object.keys(metrics.winRateBySource).length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2">Win Rate by Source:</p>
              <div className="space-y-1">
                {Object.entries(metrics.winRateBySource).map(([source, rate]) => (
                  <div key={source} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{source}:</span>
                    <span className="font-medium">{rate.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
