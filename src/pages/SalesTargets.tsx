import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SetTargetsDialog } from "@/components/kpi/SetTargetsDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";

interface SalesUser {
  id: string;
  email: string;
  full_name: string | null;
}

const SalesTargets = () => {
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSalesUsers();
  }, []);

  const fetchSalesUsers = async () => {
    try {
      setIsLoading(true);

      // Get all users with sales role
      const { data: salesRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'sales');

      if (rolesError) throw rolesError;

      const userIds = salesRoles?.map(r => r.user_id) || [];

      if (userIds.length === 0) {
        setSalesUsers([]);
        return;
      }

      // Get profile information for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      setSalesUsers(profiles || []);
    } catch (error) {
      console.error('Error fetching sales users:', error);
      toast({
        title: "Error",
        description: "Failed to load sales team members",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Sales Targets Management</h1>
          <p className="text-muted-foreground">
            Set and manage monthly and quarterly targets for your sales team
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : salesUsers.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Sales Users Found</CardTitle>
              <CardDescription>
                There are no users with the sales role assigned. Assign users to the sales role first.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {salesUsers.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Target className="h-8 w-8 text-blue-600" />
                    <div>
                      <CardTitle>{user.full_name || "Unknown User"}</CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <SetTargetsDialog 
                    userId={user.id} 
                    userName={user.full_name || user.email || "Unknown User"} 
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SalesTargets;
