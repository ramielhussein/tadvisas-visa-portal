import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, DollarSign, Clock, Target, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface ConversionData {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  avgTimeToConversion: number | null;
  revenueBySource: Record<string, { leads: number; deals: number; revenue: number }>;
  lostLeads: number;
  activeLeads: number;
}

export const ConversionMetrics = () => {
  const [data, setData] = useState<ConversionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Fetch all leads
      const { data: leads } = await supabase
        .from("leads")
        .select("id, lead_source, status, created_at, archived")
        .eq("archived", false);

      // Fetch all deals with lead links
      const { data: deals } = await supabase
        .from("deals")
        .select("id, lead_id, deal_value, total_amount, created_at, status");

      if (!leads || !deals) {
        setLoading(false);
        return;
      }

      // Create a map of lead_id to deal info
      const leadToDeals = new Map<string, { dealCreatedAt: string; revenue: number }>();
      deals.forEach(deal => {
        if (deal.lead_id) {
          leadToDeals.set(deal.lead_id, {
            dealCreatedAt: deal.created_at,
            revenue: deal.total_amount || deal.deal_value || 0
          });
        }
      });

      const totalLeads = leads.length;
      const convertedLeads = leads.filter(l => leadToDeals.has(l.id)).length;
      const lostLeads = leads.filter(l => l.status === "LOST").length;
      const activeLeads = totalLeads - convertedLeads - lostLeads;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      // Calculate average time to conversion
      let totalConversionDays = 0;
      let conversionCount = 0;
      leads.forEach(lead => {
        const dealInfo = leadToDeals.get(lead.id);
        if (dealInfo) {
          const leadDate = new Date(lead.created_at);
          const dealDate = new Date(dealInfo.dealCreatedAt);
          const daysDiff = (dealDate.getTime() - leadDate.getTime()) / (1000 * 60 * 60 * 24);
          totalConversionDays += daysDiff;
          conversionCount++;
        }
      });
      const avgTimeToConversion = conversionCount > 0 ? totalConversionDays / conversionCount : null;

      // Revenue by source
      const revenueBySource: Record<string, { leads: number; deals: number; revenue: number }> = {};
      leads.forEach(lead => {
        const source = lead.lead_source || "Unknown";
        if (!revenueBySource[source]) {
          revenueBySource[source] = { leads: 0, deals: 0, revenue: 0 };
        }
        revenueBySource[source].leads++;
        const dealInfo = leadToDeals.get(lead.id);
        if (dealInfo) {
          revenueBySource[source].deals++;
          revenueBySource[source].revenue += dealInfo.revenue;
        }
      });

      setData({
        totalLeads,
        convertedLeads,
        conversionRate,
        avgTimeToConversion,
        revenueBySource,
        lostLeads,
        activeLeads
      });
    } catch (error) {
      console.error("Error fetching conversion metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  // Sort sources by revenue
  const sortedSources = Object.entries(data.revenueBySource)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.activeLeads} active • {data.lostLeads} lost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Converted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.convertedLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Leads with deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Lead to deal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg. Time to Close
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.avgTimeToConversion !== null 
                ? `${Math.round(data.avgTimeToConversion)}d` 
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lead to deal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Source */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Performance by Lead Source
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedSources.length === 0 ? (
            <p className="text-muted-foreground text-sm">No data available</p>
          ) : (
            <div className="space-y-3">
              {sortedSources.map(([source, stats]) => {
                const sourceConversion = stats.leads > 0 ? (stats.deals / stats.leads) * 100 : 0;
                return (
                  <div key={source} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{source}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{stats.leads} leads</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{stats.deals} deals</span>
                        <span className="text-xs">({sourceConversion.toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        AED {stats.revenue.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Revenue
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
