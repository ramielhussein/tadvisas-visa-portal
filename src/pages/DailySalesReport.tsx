import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const DailySalesReport = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["daily-sales-report", selectedDate],
    queryFn: async () => {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all sales users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email");

      if (!profiles) return [];

      // For each user, calculate metrics
      const results = await Promise.all(
        profiles.map(async (user) => {
          // Leads picked up (assigned) today - track assignment changes in lead_activities
          const { data: assignmentActivities } = await supabase
            .from("lead_activities")
            .select("*")
            .eq("activity_type", "system")
            .eq("title", "Assignment Changed")
            .gte("created_at", startOfDay.toISOString())
            .lte("created_at", endOfDay.toISOString());
          
          // Filter for leads assigned to this user from unassigned state
          const assignedLeads = assignmentActivities?.filter((activity: any) => {
            const metadata = activity.metadata as any;
            return metadata?.new_assigned_to === user.id && metadata?.old_assigned_to === null;
          }) || [];

          // Lead activities today
          const { data: activities } = await supabase
            .from("lead_activities")
            .select("id")
            .eq("user_id", user.id)
            .gte("created_at", startOfDay.toISOString())
            .lte("created_at", endOfDay.toISOString());

          // Deals closed today
          const { data: closedDeals } = await supabase
            .from("deals")
            .select("id")
            .eq("assigned_to", user.id)
            .in("status", ["Closed", "Won"])
            .gte("closed_at", startOfDay.toISOString())
            .lte("closed_at", endOfDay.toISOString());

          return {
            name: user.full_name || user.email || "Unknown",
            pickedUp: assignedLeads.length,
            updated: activities?.length || 0,
            closed: closedDeals?.length || 0,
          };
        })
      );

      // Filter out users with no activity
      return results.filter(r => r.pickedUp > 0 || r.updated > 0 || r.closed > 0);
    },
  });

  const totals = reportData?.reduce(
    (acc, curr) => ({
      pickedUp: acc.pickedUp + curr.pickedUp,
      updated: acc.updated + curr.updated,
      closed: acc.closed + curr.closed,
    }),
    { pickedUp: 0, updated: 0, closed: 0 }
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Daily Sales Report</h1>
          <p className="text-muted-foreground">Track daily sales performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Team Activity - {format(new Date(selectedDate), "MMM dd, yyyy")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !reportData || reportData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No activity for this date</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Salesperson</TableHead>
                  <TableHead className="text-center">Leads Picked Up</TableHead>
                  <TableHead className="text-center">Leads Updated</TableHead>
                  <TableHead className="text-center">Leads Closed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-center">{row.pickedUp}</TableCell>
                    <TableCell className="text-center">{row.updated}</TableCell>
                    <TableCell className="text-center">{row.closed}</TableCell>
                  </TableRow>
                ))}
                {totals && (
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-center">{totals.pickedUp}</TableCell>
                    <TableCell className="text-center">{totals.updated}</TableCell>
                    <TableCell className="text-center">{totals.closed}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailySalesReport;
