import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TierBadge } from "./TierBadge";
import { useSalesKPIs, TierLevel } from "@/hooks/useSalesKPIs";

interface TeamMember {
  id: string;
  name: string;
  revenueActual: number;
  revenueProgress: number;
  dealsActual: number;
  tier: TierLevel;
}

export const TeamLeaderboard = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTeamPerformance();
  }, []);

  const fetchTeamPerformance = async () => {
    try {
      // Fetch all users with sales role
      const { data: salesUsers } = await supabase
        .from('user_roles')
        .select('user_id, profiles(full_name)')
        .eq('role', 'sales');

      if (!salesUsers) return;

      const membersData: TeamMember[] = [];

      // Fetch KPIs for each user
      for (const user of salesUsers) {
        const { data: targets } = await supabase
          .from('sales_targets')
          .select('revenue_target')
          .eq('user_id', user.user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const { data: deals } = await supabase
          .from('deals')
          .select('total_amount')
          .eq('assigned_to', user.user_id)
          .eq('status', 'Closed Won');

        const revenueActual = deals?.reduce((sum, d) => sum + Number(d.total_amount || 0), 0) || 0;
        const revenueTarget = targets?.revenue_target || 1;
        const revenueProgress = (revenueActual / revenueTarget) * 100;

        let tier: TierLevel = 'none';
        if (revenueProgress >= 100) tier = 'gold';
        else if (revenueProgress >= 80) tier = 'silver';
        else if (revenueProgress >= 60) tier = 'bronze';

        membersData.push({
          id: user.user_id,
          name: (user.profiles as any)?.full_name || 'Unknown',
          revenueActual,
          revenueProgress,
          dealsActual: deals?.length || 0,
          tier,
        });
      }

      // Sort by revenue actual
      membersData.sort((a, b) => b.revenueActual - a.revenueActual);
      setTeamMembers(membersData);
    } catch (error) {
      console.error('Error fetching team performance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="text-yellow-500" size={20} />;
    if (index === 1) return <Medal className="text-gray-400" size={20} />;
    if (index === 2) return <Award className="text-orange-600" size={20} />;
    return <span className="text-muted-foreground font-medium">{index + 1}</span>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Team Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Team Leaderboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {teamMembers.map((member, index) => (
          <div 
            key={member.id} 
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
          >
            <div className="w-8 flex justify-center">
              {getRankIcon(index)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm truncate">{member.name}</p>
                <TierBadge level={member.tier} size="sm" />
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>AED {member.revenueActual.toLocaleString()}</span>
                <span>•</span>
                <span>{member.dealsActual} deals</span>
                <span>•</span>
                <span className={member.revenueProgress >= 100 ? "text-green-600 font-medium" : ""}>
                  {member.revenueProgress.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {teamMembers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No team members found
          </p>
        )}
      </CardContent>
    </Card>
  );
};
