import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  icon: LucideIcon;
  target: number;
  actual: number;
  progress: number;
  unit?: string;
  color: string;
}

export const KPICard = ({ 
  title, 
  icon: Icon, 
  target, 
  actual, 
  progress, 
  unit = "",
  color 
}: KPICardProps) => {
  const isOverTarget = progress >= 100;
  const progressColor = isOverTarget ? "bg-green-500" : progress >= 70 ? "bg-blue-500" : progress >= 40 ? "bg-yellow-500" : "bg-red-500";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
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
        </div>
      </CardContent>
    </Card>
  );
};
