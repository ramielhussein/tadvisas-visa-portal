import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface SalesUser {
  id: string;
  email: string;
  isActive: boolean;
}

const RoundRobinToggle = () => {
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);

  useEffect(() => {
    fetchRoundRobinStatus();
    fetchSalesUsers();
  }, []);

  const fetchSalesUsers = async () => {
    try {
      // Get all users with sales permissions
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, permissions")
        .order("email");

      if (profilesError) throw profilesError;

      // Filter users who have sales permissions
      const salesProfiles = (profiles || []).filter(profile => {
        const perms = profile.permissions as any;
        return perms?.leads?.create || perms?.leads?.assign || 
               perms?.deals?.create || perms?.deals?.edit;
      });

      // Get active status for each user
      const { data: activeSettings, error: activeError } = await supabase
        .from("settings")
        .select("key, value")
        .like("key", "sales_active_%");

      if (activeError && activeError.code !== 'PGRST116') throw activeError;

      const activeMap = new Map(
        (activeSettings || []).map(s => [s.key.replace("sales_active_", ""), s.value === "true"])
      );

      const usersWithStatus = salesProfiles.map(user => ({
        id: user.id,
        email: user.email,
        isActive: activeMap.get(user.id) ?? true, // Default to active
      }));

      setSalesUsers(usersWithStatus);
    } catch (error: any) {
      console.error("Error fetching sales users:", error);
      toast({
        title: "Error",
        description: "Failed to load sales team members",
        variant: "destructive",
      });
    }
  };

  const fetchRoundRobinStatus = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "round_robin_enabled")
        .maybeSingle();

      if (error) throw error;
      
      setIsEnabled(data?.value === "true");
    } catch (error: any) {
      console.error("Error fetching round robin status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from("settings")
        .upsert({
          key: "round_robin_enabled",
          value: checked ? "true" : "false",
        }, {
          onConflict: "key"
        });

      if (error) throw error;

      setIsEnabled(checked);
      
      toast({
        title: checked ? "Round Robin Enabled" : "Round Robin Disabled",
        description: checked 
          ? "New leads will be automatically assigned to active sales team members"
          : "Automatic lead assignment has been disabled",
      });
    } catch (error: any) {
      console.error("Error updating round robin status:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUserActiveToggle = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("settings")
        .upsert({
          key: `sales_active_${userId}`,
          value: isActive ? "true" : "false",
        }, {
          onConflict: "key"
        });

      if (error) throw error;

      setSalesUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, isActive } : user
        )
      );

      toast({
        title: "Updated",
        description: `${salesUsers.find(u => u.id === userId)?.email} ${isActive ? "enabled" : "disabled"}`,
      });
    } catch (error: any) {
      console.error("Error updating user active status:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-Assignment (Round Robin)</CardTitle>
        <CardDescription>
          Automatically assign new leads to active sales team members in rotation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Switch
                id="round-robin"
                checked={isEnabled}
                onCheckedChange={handleToggle}
                disabled={isSaving}
              />
              <Label htmlFor="round-robin" className="cursor-pointer font-semibold">
                {isEnabled ? "Enabled" : "Disabled"}
                {isSaving && " (Saving...)"}
              </Label>
            </>
          )}
        </div>

        {salesUsers.length > 0 && (
          <div className="mt-4 space-y-2">
            <Label className="text-sm font-semibold">Active Team Members:</Label>
            <div className="space-y-2 pl-2">
              {salesUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={user.isActive}
                    onCheckedChange={(checked) => 
                      handleUserActiveToggle(user.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`user-${user.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {user.email}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoundRobinToggle;
