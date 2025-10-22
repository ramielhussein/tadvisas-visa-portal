import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const RoundRobinToggle = () => {
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRoundRobinStatus();
  }, []);

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
      
      // Upsert the setting
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
          ? "New leads will be automatically assigned to sales team members"
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-Assignment (Round Robin)</CardTitle>
        <CardDescription>
          Automatically assign new leads to sales team members in rotation. 
          Only applies to newly created leads.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              <Label htmlFor="round-robin" className="cursor-pointer">
                {isEnabled ? "Enabled" : "Disabled"}
                {isSaving && " (Saving...)"}
              </Label>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoundRobinToggle;
