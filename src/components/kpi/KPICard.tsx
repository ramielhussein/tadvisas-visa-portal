import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";
import { TierBadge } from "./TierBadge";
import { TierLevel } from "@/hooks/useSalesKPIs";

interface KPICardProps {
  title: string;
  icon: LucideIcon;
  target: number;
  actual: number;
  progress: number;
  unit?: string;
  color: string;
  tier?: TierLevel;
  gap?: number;
  dailyNeeded?: number;
  projected?: number;
}

export const KPICard = ({ 
  title, 
  icon: Icon, 
  target, 
  actual, 
  progress, 
  unit = "",
  color,
  tier,
  gap,
  dailyNeeded,
  projected
}: KPICardProps) => {
  const isOverTarget = progress >= 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {tier && <TierBadge level={tier} size="sm" />}
          </div>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold">
              {unit === "%" ? actual.toFixed(1) : actual.toLocaleString()}
              {unit}
            </span>
            <span className="text-sm text-muted-foreground">
              / {unit === "%" ? target.toFixed(1) : target.toLocaleString()}{unit}
            </span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-2" />
          <div className="flex justify-between text-xs">
            <span className={progress >= 100 ? "text-green-600 font-semibold" : "text-muted-foreground"}>
              {progress.toFixed(0)}% achieved
            </span>
            {progress >= 100 && (
              <span className="text-green-600 font-semibold">🎉 Target Met!</span>
            )}
          </div>
          
          {/* Gap & Pacing Info */}
          {gap !== undefined && gap > 0 && (
            <div className="pt-2 border-t space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Gap to target:</span>
                <span className="font-medium">
                  {unit === "%" ? gap.toFixed(1) : gap.toLocaleString()}{unit}
                </span>
              </div>
              {dailyNeeded !== undefined && dailyNeeded > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Daily needed:</span>
                  <span className="font-medium">
                    {unit === "%" ? dailyNeeded.toFixed(1) : dailyNeeded.toFixed(1)}{unit}/day
                  </span>
                </div>
              )}
              {projected !== undefined && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Projected:</span>
                  <span className={`font-medium ${projected >= target ? "text-green-600" : "text-orange-600"}`}>
                    {unit === "%" ? projected.toFixed(1) : projected.toLocaleString()}{unit}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
