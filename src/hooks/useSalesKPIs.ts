import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format } from "date-fns";

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
        .select('total_amount, status')
        .eq('assigned_to', targetUserId)
        .eq('status', 'Closed Won')
        .gte('closed_at', startStr)
        .lte('closed_at', endStr);

      if (dealsError) {
        console.error('Error fetching deals:', dealsError);
      }

      const revenueActual = deals?.reduce((sum, deal) => sum + Number(deal.total_amount || 0), 0) || 0;
      const dealsActual = deals?.length || 0;

      // Fetch conversion rate (leads converted / total leads)
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', targetUserId)
        .gte('created_at', startStr)
        .lte('created_at', endStr);

      const { count: convertedLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', targetUserId)
        .eq('client_converted', true)
        .gte('created_at', startStr)
        .lte('created_at', endStr);

      const conversionActual = totalLeads && totalLeads > 0 
        ? ((convertedLeads || 0) / totalLeads) * 100 
        : 0;

      // Fetch activity count (calls, emails, whatsapp)
      const { count: activityCount } = await supabase
        .from('lead_activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .in('activity_type', ['call', 'email', 'whatsapp'])
        .gte('created_at', startStr)
        .lte('created_at', endStr);

      const activityActual = activityCount || 0;

      // Calculate progress percentages
      const revenueTarget = targets?.revenue_target || 0;
      const dealsTarget = targets?.deals_target || 0;
      const conversionTarget = targets?.conversion_rate_target || 0;
      const activityTarget = targets?.activity_target || 0;

      const kpisData: SalesKPIs = {
        revenueTarget,
        dealsTarget,
        conversionTarget,
        activityTarget,
        revenueActual,
        dealsActual,
        conversionActual,
        activityActual,
        revenueProgress: revenueTarget > 0 ? (revenueActual / revenueTarget) * 100 : 0,
        dealsProgress: dealsTarget > 0 ? (dealsActual / dealsTarget) * 100 : 0,
        conversionProgress: conversionTarget > 0 ? (conversionActual / conversionTarget) * 100 : 0,
        activityProgress: activityTarget > 0 ? (activityActual / activityTarget) * 100 : 0,
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
