import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, TrendingUp, Users, ArrowRight, Phone, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

interface SalesLeaderboardEntry {
  id: string;
  name: string;
  email: string;
  todayActivities: number;
  weekActivities: number;
  todayCalls: number;
  weekCalls: number;
}

const SalesDashboard = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<SalesLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Get all users with sales role
      const { data: salesRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'sales');

      if (rolesError) throw rolesError;

      if (!salesRoles || salesRoles.length === 0) {
        setLeaderboard([]);
        return;
      }

      const salesUserIds = salesRoles.map(r => r.user_id);

      // Get profiles for sales users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', salesUserIds);

      if (profilesError) throw profilesError;

      // Calculate date ranges
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get all activities for these users in the last 7 days
      const { data: activities, error: activitiesError } = await supabase
        .from('lead_activities')
        .select('user_id, activity_type, created_at')
        .in('user_id', salesUserIds)
        .gte('created_at', weekStart);

      if (activitiesError) throw activitiesError;

      // Calculate metrics for each salesperson
      const leaderboardData: SalesLeaderboardEntry[] = (profiles || []).map(profile => {
        const userActivities = (activities || []).filter(a => a.user_id === profile.id);
        
        const todayActivities = userActivities.filter(a => a.created_at >= todayStart).length;
        const weekActivities = userActivities.length;
        const todayCalls = userActivities.filter(a => a.created_at >= todayStart && a.activity_type === 'call').length;
        const weekCalls = userActivities.filter(a => a.activity_type === 'call').length;

        return {
          id: profile.id,
          name: profile.full_name || profile.email?.split('@')[0] || 'Unknown',
          email: profile.email || '',
          todayActivities,
          weekActivities,
          todayCalls,
          weekCalls,
        };
      });

      // Sort by today's activities first, then week activities
      leaderboardData.sort((a, b) => {
        if (b.todayActivities !== a.todayActivities) {
          return b.todayActivities - a.todayActivities;
        }
        return b.weekActivities - a.weekActivities;
      });

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{index + 1}</span>;
    }
  };

  // Find current user's stats
  const currentUserEntry = leaderboard.find(e => e.id === currentUserId);
  const currentUserRank = leaderboard.findIndex(e => e.id === currentUserId) + 1;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Personal Stats */}
        {currentUserEntry && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 text-center">
                <Activity className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-2xl font-bold text-primary">{currentUserEntry.todayActivities}</p>
                <p className="text-xs text-muted-foreground">Today's Updates</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Activity className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-2xl font-bold">{currentUserEntry.weekActivities}</p>
                <p className="text-xs text-muted-foreground">7-Day Updates</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
              <CardContent className="p-4 text-center">
                <Phone className="h-5 w-5 mx-auto text-green-600 mb-1" />
                <p className="text-2xl font-bold text-green-600">{currentUserEntry.todayCalls}</p>
                <p className="text-xs text-muted-foreground">Today's Calls</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                <p className="text-2xl font-bold">#{currentUserRank}</p>
                <p className="text-xs text-muted-foreground">Your Rank</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Leaderboard Section */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Sales Leaderboard</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {leaderboard.length} Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-20 ml-auto" />
                  </div>
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No sales team members found</p>
            ) : (
              <div className="space-y-2">
                {/* Header row */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                  <div className="col-span-1">#</div>
                  <div className="col-span-5">Name</div>
                  <div className="col-span-3 text-center">Today</div>
                  <div className="col-span-3 text-center">7 Days</div>
                </div>

                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg transition-colors ${
                      entry.id === currentUserId 
                        ? 'bg-primary/10 border border-primary/20' 
                        : index < 3 
                          ? 'bg-muted/50' 
                          : 'hover:bg-muted/30'
                    }`}
                  >
                    <div className="col-span-1 flex justify-center">
                      {getRankIcon(index)}
                    </div>
                    <div className="col-span-5">
                      <p className={`font-medium text-sm truncate ${entry.id === currentUserId ? 'text-primary' : ''}`}>
                        {entry.name}
                        {entry.id === currentUserId && (
                          <Badge variant="secondary" className="ml-2 text-[10px] px-1 py-0">You</Badge>
                        )}
                      </p>
                    </div>
                    <div className="col-span-3 text-center">
                      <Badge 
                        variant={entry.todayActivities > 0 ? "default" : "secondary"}
                        className="text-xs font-bold min-w-[60px] justify-center"
                      >
                        {entry.todayActivities}
                      </Badge>
                    </div>
                    <div className="col-span-3 text-center">
                      <Badge 
                        variant="outline"
                        className="text-xs min-w-[60px] justify-center"
                      >
                        {entry.weekActivities}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Action to CRM */}
        <Button 
          onClick={() => navigate('/crm')} 
          className="w-full"
          size="lg"
        >
          Go to Lead Management
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </Layout>
  );
};

export default SalesDashboard;
