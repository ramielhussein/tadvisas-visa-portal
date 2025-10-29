import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";

const DailyHeadcount = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    at_center: "",
    at_accommodation: "",
    with_clients: "",
    in_transit: "",
    returned_processing: "",
    notes: "",
  });

  const { data: todayHeadcount } = useQuery({
    queryKey: ["daily-headcount-today"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("daily_headcount")
        .select("*")
        .eq("count_date", today)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const { data: yesterdayHeadcount } = useQuery({
    queryKey: ["daily-headcount-yesterday"],
    queryFn: async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = format(yesterday, "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("daily_headcount")
        .select("*")
        .eq("count_date", yesterdayStr)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const saveHeadcountMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const today = format(new Date(), "yyyy-MM-dd");
      const totalWorkers = 
        parseInt(data.at_center || "0") +
        parseInt(data.at_accommodation || "0") +
        parseInt(data.with_clients || "0") +
        parseInt(data.in_transit || "0") +
        parseInt(data.returned_processing || "0");

      const { error } = await supabase.from("daily_headcount").upsert({
        count_date: today,
        total_workers: totalWorkers,
        at_center: parseInt(data.at_center || "0"),
        at_accommodation: parseInt(data.at_accommodation || "0"),
        with_clients: parseInt(data.with_clients || "0"),
        in_transit: parseInt(data.in_transit || "0"),
        returned_processing: parseInt(data.returned_processing || "0"),
        notes: data.notes,
        counted_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Daily headcount saved successfully");
      queryClient.invalidateQueries({ queryKey: ["daily-headcount-today"] });
    },
    onError: (error) => {
      toast.error("Failed to save headcount: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveHeadcountMutation.mutate(formData);
  };

  const currentTotal = 
    parseInt(formData.at_center || todayHeadcount?.at_center?.toString() || "0") +
    parseInt(formData.at_accommodation || todayHeadcount?.at_accommodation?.toString() || "0") +
    parseInt(formData.with_clients || todayHeadcount?.with_clients?.toString() || "0") +
    parseInt(formData.in_transit || todayHeadcount?.in_transit?.toString() || "0") +
    parseInt(formData.returned_processing || todayHeadcount?.returned_processing?.toString() || "0");

  const previousTotal = yesterdayHeadcount?.total_workers || 0;
  const difference = currentTotal - previousTotal;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Daily Headcount</h1>
          <p className="text-muted-foreground">Monitor and verify daily worker counts</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentTotal}</div>
              <p className="text-xs text-muted-foreground">
                {difference > 0 ? "+" : ""}{difference} from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Yesterday</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{previousTotal}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              {todayHeadcount ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {todayHeadcount ? "Count Completed" : "Pending"}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Record Today's Count</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="at_center">At Center</Label>
                  <Input
                    id="at_center"
                    type="number"
                    min="0"
                    value={formData.at_center || todayHeadcount?.at_center || ""}
                    onChange={(e) => setFormData({ ...formData, at_center: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="at_accommodation">At Accommodation</Label>
                  <Input
                    id="at_accommodation"
                    type="number"
                    min="0"
                    value={formData.at_accommodation || todayHeadcount?.at_accommodation || ""}
                    onChange={(e) => setFormData({ ...formData, at_accommodation: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="with_clients">With Clients</Label>
                  <Input
                    id="with_clients"
                    type="number"
                    min="0"
                    value={formData.with_clients || todayHeadcount?.with_clients || ""}
                    onChange={(e) => setFormData({ ...formData, with_clients: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="in_transit">In Transit</Label>
                  <Input
                    id="in_transit"
                    type="number"
                    min="0"
                    value={formData.in_transit || todayHeadcount?.in_transit || ""}
                    onChange={(e) => setFormData({ ...formData, in_transit: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="returned_processing">Returned (Processing)</Label>
                  <Input
                    id="returned_processing"
                    type="number"
                    min="0"
                    value={formData.returned_processing || todayHeadcount?.returned_processing || ""}
                    onChange={(e) => setFormData({ ...formData, returned_processing: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes & Discrepancies</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || todayHeadcount?.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Document any discrepancies, missing workers, or new arrivals..."
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saveHeadcountMutation.isPending}>
                  {saveHeadcountMutation.isPending ? "Saving..." : "Save Headcount"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DailyHeadcount;
