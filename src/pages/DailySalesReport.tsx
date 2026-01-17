import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronDown, ChevronRight, User } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// Define the specific sales team members
const SALES_TEAM = [
  { name: "Ramadan", email: "sales1@tadmaids.com" },
  { name: "Mahmoud", email: "mahmoud@tadmaids.com" },
  { name: "Sameer", email: "sameer@tadmaids.com" },
  { name: "Sakib", email: "sakib@tadmaids.com" },
  { name: "Gladys", email: "ph@tadmaids.com" },
  { name: "Jafar", email: "sales7@tadmaids.com" },
];

// All possible lead statuses
const LEAD_STATUSES = [
  "New Lead",
  "Warm",
  "HOT",
  "SOLD",
  "LOST",
  "PROBLEM",
  "Called No Answer",
  "Called Engaged",
  "Called COLD",
  "Called Unanswer 2",
  "No Connection",
];

interface SalesPersonData {
  id: string;
  name: string;
  email: string;
  totalLeadsTaken: number;
  statusCounts: Record<string, number>;
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    "New Lead": "bg-blue-100 text-blue-800",
    "Warm": "bg-orange-100 text-orange-800",
    "HOT": "bg-red-100 text-red-800",
    "SOLD": "bg-green-100 text-green-800",
    "LOST": "bg-gray-100 text-gray-800",
    "PROBLEM": "bg-purple-100 text-purple-800",
    "Called No Answer": "bg-yellow-100 text-yellow-800",
    "Called Engaged": "bg-amber-100 text-amber-800",
    "Called COLD": "bg-cyan-100 text-cyan-800",
    "Called Unanswer 2": "bg-indigo-100 text-indigo-800",
    "No Connection": "bg-slate-100 text-slate-800",
  };
  return colors[status] || "bg-muted text-muted-foreground";
};

const DailySalesReport = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expandedSalesPerson, setExpandedSalesPerson] = useState<string | null>(null);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["daily-sales-report-detailed", selectedDate],
    queryFn: async () => {
      // Get profiles for our sales team
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("email", SALES_TEAM.map(s => s.email));

      if (!profiles) return [];

      // Create a map of email to profile
      const profileMap = new Map(profiles.map(p => [p.email, p]));

      // For each sales person in our defined list
      const results: SalesPersonData[] = await Promise.all(
        SALES_TEAM.map(async (salesPerson) => {
          const profile = profileMap.get(salesPerson.email);
          
          if (!profile) {
            return {
              id: salesPerson.email,
              name: salesPerson.name,
              email: salesPerson.email,
              totalLeadsTaken: 0,
              statusCounts: {},
            };
          }

          // Get all leads currently assigned to this salesperson that were updated today
          // This captures all leads they worked on or were assigned today
          const { data: assignedLeads } = await supabase
            .from("leads")
            .select("id, status, created_at, updated_at")
            .eq("assigned_to", profile.id)
            .gte("updated_at", `${selectedDate}T00:00:00`)
            .lte("updated_at", `${selectedDate}T23:59:59`);

          // Count status breakdown of assigned leads
          const statusCounts: Record<string, number> = {};
          assignedLeads?.forEach(lead => {
            const status = lead.status || "Unknown";
            statusCounts[status] = (statusCounts[status] || 0) + 1;
          });

          return {
            id: profile.id,
            name: salesPerson.name,
            email: salesPerson.email,
            totalLeadsTaken: assignedLeads?.length || 0,
            statusCounts,
          };
        })
      );

      return results;
    },
  });

  const toggleExpanded = (id: string) => {
    setExpandedSalesPerson(expandedSalesPerson === id ? null : id);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Daily Sales Report</h1>
          <p className="text-muted-foreground">Track daily sales activity by team member</p>
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
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {reportData?.map((salesPerson) => (
                <Collapsible
                  key={salesPerson.id}
                  open={expandedSalesPerson === salesPerson.id}
                  onOpenChange={() => toggleExpanded(salesPerson.id)}
                >
                  <CollapsibleTrigger asChild>
                    <div
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                        expandedSalesPerson === salesPerson.id && "bg-muted/50 border-primary"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {expandedSalesPerson === salesPerson.id ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{salesPerson.name}</h3>
                            <p className="text-sm text-muted-foreground">{salesPerson.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold">{salesPerson.totalLeadsTaken}</p>
                          <p className="text-xs text-muted-foreground">Leads Assigned Today</p>
                        </div>
                        {Object.keys(salesPerson.statusCounts).length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {Object.values(salesPerson.statusCounts).reduce((a, b) => a + b, 0)} statuses
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 ml-8 p-4 bg-muted/30 rounded-lg border">
                      <h4 className="font-medium mb-3">Status Breakdown of Assigned Leads:</h4>
                      {Object.keys(salesPerson.statusCounts).length === 0 ? (
                        <p className="text-muted-foreground text-sm">No leads assigned today</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {LEAD_STATUSES.map((status) => {
                            const count = salesPerson.statusCounts[status] || 0;
                            if (count === 0) return null;
                            return (
                              <div
                                key={status}
                                className={cn(
                                  "flex items-center justify-between px-3 py-2 rounded-md",
                                  getStatusColor(status)
                                )}
                              >
                                <span className="font-medium text-sm">{status}</span>
                                <span className="font-bold">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Show all statuses with 0 counts in a muted style */}
                      <div className="mt-4 pt-4 border-t">
                        <h5 className="text-sm text-muted-foreground mb-2">All Status Options:</h5>
                        <div className="flex flex-wrap gap-2">
                          {LEAD_STATUSES.map((status) => {
                            const count = salesPerson.statusCounts[status] || 0;
                            return (
                              <Badge
                                key={status}
                                variant={count > 0 ? "default" : "outline"}
                                className={cn(
                                  "text-xs",
                                  count > 0 ? getStatusColor(status) : "text-muted-foreground"
                                )}
                              >
                                {status}: {count}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Team Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {reportData.map((salesPerson) => (
                <div key={salesPerson.id} className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="font-semibold">{salesPerson.name}</p>
                  <p className="text-2xl font-bold text-primary">{salesPerson.totalLeadsTaken}</p>
                  <p className="text-xs text-muted-foreground">leads assigned</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Leads Assigned Today:</span>
                <span className="text-2xl font-bold text-primary">
                  {reportData.reduce((sum, sp) => sum + sp.totalLeadsTaken, 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DailySalesReport;
