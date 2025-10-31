import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Target } from "lucide-react";
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, format } from "date-fns";

interface SetTargetsDialogProps {
  userId: string;
  userName: string;
}

export const SetTargetsDialog = ({ userId, userName }: SetTargetsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [periodType, setPeriodType] = useState<"monthly" | "quarterly">("monthly");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    revenueTarget: "",
    dealsTarget: "",
    conversionTarget: "",
    activityTarget: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Calculate period dates
      const now = new Date();
      const periodStart = periodType === "monthly" ? startOfMonth(now) : startOfQuarter(now);
      const periodEnd = periodType === "monthly" ? endOfMonth(now) : endOfQuarter(now);

      const { error } = await supabase
        .from('sales_targets')
        .upsert({
          user_id: userId,
          period_type: periodType,
          period_start: format(periodStart, 'yyyy-MM-dd'),
          period_end: format(periodEnd, 'yyyy-MM-dd'),
          revenue_target: parseFloat(formData.revenueTarget) || 0,
          deals_target: parseInt(formData.dealsTarget) || 0,
          conversion_rate_target: parseFloat(formData.conversionTarget) || 0,
          activity_target: parseInt(formData.activityTarget) || 0,
          created_by: user.id,
          notes: formData.notes,
        }, {
          onConflict: 'user_id,period_start,period_end'
        });

      if (error) throw error;

      toast({
        title: "Targets Set Successfully",
        description: `${periodType === "monthly" ? "Monthly" : "Quarterly"} targets have been set for ${userName}`,
      });

      setOpen(false);
      setFormData({
        revenueTarget: "",
        dealsTarget: "",
        conversionTarget: "",
        activityTarget: "",
        notes: "",
      });
    } catch (error) {
      console.error('Error setting targets:', error);
      toast({
        title: "Error",
        description: "Failed to set targets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Target className="h-4 w-4 mr-2" />
          Set Targets
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Set Sales Targets for {userName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="periodType">Period Type</Label>
            <Select value={periodType} onValueChange={(value: "monthly" | "quarterly") => setPeriodType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="revenueTarget">Revenue Target (AED)</Label>
            <Input
              id="revenueTarget"
              type="number"
              placeholder="300000"
              value={formData.revenueTarget}
              onChange={(e) => setFormData({ ...formData, revenueTarget: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dealsTarget">Deals Target (Count)</Label>
            <Input
              id="dealsTarget"
              type="number"
              placeholder="30"
              value={formData.dealsTarget}
              onChange={(e) => setFormData({ ...formData, dealsTarget: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conversionTarget">Conversion Rate Target (%)</Label>
            <Input
              id="conversionTarget"
              type="number"
              step="0.1"
              placeholder="25"
              value={formData.conversionTarget}
              onChange={(e) => setFormData({ ...formData, conversionTarget: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activityTarget">Activity Target (Calls/Emails)</Label>
            <Input
              id="activityTarget"
              type="number"
              placeholder="100"
              value={formData.activityTarget}
              onChange={(e) => setFormData({ ...formData, activityTarget: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Setting..." : "Set Targets"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
