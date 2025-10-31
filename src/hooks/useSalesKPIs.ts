import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format, startOfWeek, subWeeks, differenceInDays } from "date-fns";

export type TierLevel = 'none' | 'bronze' | 'silver' | 'gold';

export interface TierAchievement {
  level: TierLevel;
  threshold: number;
  color: string;
}

export interface GapAnalysis {
  revenueGap: number;
  dealsGap: number;
  conversionGap: number;
  activityGap: number;
}

export interface PacingMetrics {
  dailyRevenueNeeded: number;
  dailyDealsNeeded: number;
  dailyActivityNeeded: number;
  daysRemaining: number;
  projectedRevenue: number;
  projectedDeals: number;
  projectedActivity: number;
}

export interface LeadMetrics {
  totalLeads: number;
  newLeads: number;
  warmLeads: number;
  hotLeads: number;
  soldLeads: number;
  lostLeads: number;
  averageDealSize: number;
  winRateBySource: Record<string, number>;
}

export interface TrendData {
  currentWeek: {
    revenue: number;
    deals: number;
    conversion: number;
    activities: number;
  };
  lastWeek: {
    revenue: number;
    deals: number;
    conversion: number;
    activities: number;
  };
  weekOverWeek: {
    revenueChange: number;
    dealsChange: number;
    conversionChange: number;
    activitiesChange: number;
  };
}

export interface SalesKPIs {
  // Targets
  revenueTarget: number;
  dealsTarget: number;
  conversionTarget: number;
  activityTarget: number;
  
  // Actuals
  revenueActual: number;
  dealsActual: number;
  conversionActual: number;
  activityActual: number;
  
  // Progress percentages
  revenueProgress: number;
  dealsProgress: number;
  conversionProgress: number;
  activityProgress: number;
  
  // Tier achievements
  revenueTier: TierAchievement;
  dealsTier: TierAchievement;
  conversionTier: TierAchievement;
  activityTier: TierAchievement;
  
  // Gap analysis
  gap: GapAnalysis;
  
  // Pacing metrics
  pacing: PacingMetrics;
  
  // Lead metrics
  leadMetrics: LeadMetrics;
  
  // Trends
  trends: TrendData;
  
  // Period info
  periodStart: string;
  periodEnd: string;
}

export const useSalesKPIs = (userId?: string, periodStart?: Date, periodEnd?: Date) => {
  const [kpis, setKpis] = useState<SalesKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKPIs();
  }, [userId, periodStart, periodEnd]);

  const calculateTier = (progress: number): TierAchievement => {
    if (progress >= 100) return { level: 'gold', threshold: 100, color: 'text-yellow-500' };
    if (progress >= 80) return { level: 'silver', threshold: 80, color: 'text-gray-400' };
    if (progress >= 60) return { level: 'bronze', threshold: 60, color: 'text-orange-600' };
    return { level: 'none', threshold: 0, color: 'text-muted-foreground' };
  };

  const fetchKPIs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Determine the user ID
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("User not authenticated");
        }
        targetUserId = user.id;
      }

      // Determine the period
      const start = periodStart || startOfMonth(new Date());
      const end = periodEnd || endOfMonth(new Date());
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

      // Fetch targets
      const { data: targets, error: targetsError } = await supabase
        .from('sales_targets')
        .select('*')
        .eq('user_id', targetUserId)
        .lte('period_start', endStr)
        .gte('period_end', startStr)
        .single();

      if (targetsError && targetsError.code !== 'PGRST116') {
        console.error('Error fetching targets:', targetsError);
      }

      // Fetch actual revenue and deals count
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('total_amount, status, closed_at, lead_id')
        .eq('assigned_to', targetUserId)
        .eq('status', 'Closed Won')
        .gte('closed_at', startStr)
        .lte('closed_at', endStr);

      if (dealsError) {
        console.error('Error fetching deals:', dealsError);
      }

      const revenueActual = deals?.reduce((sum, deal) => sum + Number(deal.total_amount || 0), 0) || 0;
      const dealsActual = deals?.length || 0;

      // Fetch all leads for funnel metrics
      const { data: allLeads } = await supabase
        .from('leads')
        .select('*, lead_source')
        .eq('assigned_to', targetUserId)
        .gte('created_at', startStr)
        .lte('created_at', endStr);

      const totalLeads = allLeads?.length || 0;
      const newLeads = allLeads?.filter(l => l.status === 'New Lead').length || 0;
      const warmLeads = allLeads?.filter(l => l.status === 'Warm').length || 0;
      const hotLeads = allLeads?.filter(l => l.status === 'HOT').length || 0;
      const soldLeads = allLeads?.filter(l => l.client_converted).length || 0;
      const lostLeads = allLeads?.filter(l => l.status === 'LOST').length || 0;

      // Calculate conversion rate
      const conversionActual = totalLeads > 0 ? (soldLeads / totalLeads) * 100 : 0;

      // Calculate average deal size
      const averageDealSize = dealsActual > 0 ? revenueActual / dealsActual : 0;

      // Calculate win rate by source
      const winRateBySource: Record<string, number> = {};
      const sourceGroups = allLeads?.reduce((acc, lead) => {
        const source = lead.lead_source || 'Unknown';
        if (!acc[source]) acc[source] = { total: 0, converted: 0 };
        acc[source].total++;
        if (lead.client_converted) acc[source].converted++;
        return acc;
      }, {} as Record<string, { total: number; converted: number }>);

      Object.entries(sourceGroups || {}).forEach(([source, data]) => {
        winRateBySource[source] = data.total > 0 ? (data.converted / data.total) * 100 : 0;
      });

      // Fetch activity count
      const { count: activityCount } = await supabase
        .from('lead_activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .in('activity_type', ['call', 'email', 'whatsapp'])
        .gte('created_at', startStr)
        .lte('created_at', endStr);

      const activityActual = activityCount || 0;

      // Fetch trends data (current week vs last week)
      const currentWeekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
      const lastWeekStart = format(startOfWeek(subWeeks(new Date(), 1)), 'yyyy-MM-dd');
      const lastWeekEnd = format(subWeeks(new Date(), 1), 'yyyy-MM-dd');

      const { data: currentWeekDeals } = await supabase
        .from('deals')
        .select('total_amount')
        .eq('assigned_to', targetUserId)
        .eq('status', 'Closed Won')
        .gte('closed_at', currentWeekStart);

      const { data: lastWeekDeals } = await supabase
        .from('deals')
        .select('total_amount')
        .eq('assigned_to', targetUserId)
        .eq('status', 'Closed Won')
        .gte('closed_at', lastWeekStart)
        .lte('closed_at', lastWeekEnd);

      const { data: currentWeekLeads } = await supabase
        .from('leads')
        .select('client_converted')
        .eq('assigned_to', targetUserId)
        .gte('created_at', currentWeekStart);

      const { data: lastWeekLeads } = await supabase
        .from('leads')
        .select('client_converted')
        .eq('assigned_to', targetUserId)
        .gte('created_at', lastWeekStart)
        .lte('created_at', lastWeekEnd);

      const { count: currentWeekActivities } = await supabase
        .from('lead_activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .gte('created_at', currentWeekStart);

      const { count: lastWeekActivities } = await supabase
        .from('lead_activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .gte('created_at', lastWeekStart)
        .lte('created_at', lastWeekEnd);

      const currentWeekRevenue = currentWeekDeals?.reduce((sum, d) => sum + Number(d.total_amount || 0), 0) || 0;
      const lastWeekRevenue = lastWeekDeals?.reduce((sum, d) => sum + Number(d.total_amount || 0), 0) || 0;
      const currentWeekDealsCount = currentWeekDeals?.length || 0;
      const lastWeekDealsCount = lastWeekDeals?.length || 0;
      
      const currentWeekConverted = currentWeekLeads?.filter(l => l.client_converted).length || 0;
      const currentWeekTotal = currentWeekLeads?.length || 0;
      const currentWeekConversion = currentWeekTotal > 0 ? (currentWeekConverted / currentWeekTotal) * 100 : 0;
      
      const lastWeekConverted = lastWeekLeads?.filter(l => l.client_converted).length || 0;
      const lastWeekTotal = lastWeekLeads?.length || 0;
      const lastWeekConversion = lastWeekTotal > 0 ? (lastWeekConverted / lastWeekTotal) * 100 : 0;

      // Calculate targets and progress
      const revenueTarget = targets?.revenue_target || 0;
      const dealsTarget = targets?.deals_target || 0;
      const conversionTarget = targets?.conversion_rate_target || 0;
      const activityTarget = targets?.activity_target || 0;

      const revenueProgress = revenueTarget > 0 ? (revenueActual / revenueTarget) * 100 : 0;
      const dealsProgress = dealsTarget > 0 ? (dealsActual / dealsTarget) * 100 : 0;
      const conversionProgress = conversionTarget > 0 ? (conversionActual / conversionTarget) * 100 : 0;
      const activityProgress = activityTarget > 0 ? (activityActual / activityTarget) * 100 : 0;

      // Calculate pacing metrics
      const daysRemaining = differenceInDays(new Date(endStr), new Date());
      const daysElapsed = differenceInDays(new Date(), new Date(startStr));
      const dailyRevenueNeeded = daysRemaining > 0 ? (revenueTarget - revenueActual) / daysRemaining : 0;
      const dailyDealsNeeded = daysRemaining > 0 ? (dealsTarget - dealsActual) / daysRemaining : 0;
      const dailyActivityNeeded = daysRemaining > 0 ? (activityTarget - activityActual) / daysRemaining : 0;

      // Project end of period performance
      const dailyRevenueRate = daysElapsed > 0 ? revenueActual / daysElapsed : 0;
      const dailyDealsRate = daysElapsed > 0 ? dealsActual / daysElapsed : 0;
      const dailyActivityRate = daysElapsed > 0 ? activityActual / daysElapsed : 0;

      const projectedRevenue = revenueActual + (dailyRevenueRate * daysRemaining);
      const projectedDeals = dealsActual + (dailyDealsRate * daysRemaining);
      const projectedActivity = activityActual + (dailyActivityRate * daysRemaining);

      const kpisData: SalesKPIs = {
        revenueTarget,
        dealsTarget,
        conversionTarget,
        activityTarget,
        revenueActual,
        dealsActual,
        conversionActual,
        activityActual,
        revenueProgress,
        dealsProgress,
        conversionProgress,
        activityProgress,
        revenueTier: calculateTier(revenueProgress),
        dealsTier: calculateTier(dealsProgress),
        conversionTier: calculateTier(conversionProgress),
        activityTier: calculateTier(activityProgress),
        gap: {
          revenueGap: revenueTarget - revenueActual,
          dealsGap: dealsTarget - dealsActual,
          conversionGap: conversionTarget - conversionActual,
          activityGap: activityTarget - activityActual,
        },
        pacing: {
          dailyRevenueNeeded,
          dailyDealsNeeded,
          dailyActivityNeeded,
          daysRemaining,
          projectedRevenue,
          projectedDeals,
          projectedActivity,
        },
        leadMetrics: {
          totalLeads,
          newLeads,
          warmLeads,
          hotLeads,
          soldLeads,
          lostLeads,
          averageDealSize,
          winRateBySource,
        },
        trends: {
          currentWeek: {
            revenue: currentWeekRevenue,
            deals: currentWeekDealsCount,
            conversion: currentWeekConversion,
            activities: currentWeekActivities || 0,
          },
          lastWeek: {
            revenue: lastWeekRevenue,
            deals: lastWeekDealsCount,
            conversion: lastWeekConversion,
            activities: lastWeekActivities || 0,
          },
          weekOverWeek: {
            revenueChange: lastWeekRevenue > 0 ? ((currentWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0,
            dealsChange: lastWeekDealsCount > 0 ? ((currentWeekDealsCount - lastWeekDealsCount) / lastWeekDealsCount) * 100 : 0,
            conversionChange: currentWeekConversion - lastWeekConversion,
            activitiesChange: lastWeekActivities ? (((currentWeekActivities || 0) - lastWeekActivities) / lastWeekActivities) * 100 : 0,
          },
        },
        periodStart: startStr,
        periodEnd: endStr,
      };

      setKpis(kpisData);
    } catch (err) {
      console.error('Error in fetchKPIs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch KPIs');
    } finally {
      setIsLoading(false);
    }
  };

  return { kpis, isLoading, error, refetch: fetchKPIs };
};
