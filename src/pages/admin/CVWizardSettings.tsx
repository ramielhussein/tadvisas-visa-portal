import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const CVWizardSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "make_webhook_url")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setWebhookUrl(data.value || "");
      }
    } catch (error: any) {
      console.error("Error loading settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("settings")
        .upsert({
          key: "make_webhook_url",
          value: webhookUrl,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>CV Wizard Settings</CardTitle>
            <CardDescription>
              Configure integration settings for the CV submission system
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="webhook">Make (Integromat) Webhook URL</Label>
              <Input
                id="webhook"
                type="url"
                placeholder="https://hook.integromat.com/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                CV submissions will be sent to this webhook URL for automation
              </p>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CVWizardSettings;
