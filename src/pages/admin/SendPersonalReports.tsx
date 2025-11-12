import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Send, Clock, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SendPersonalReports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);

  const handleSendReports = async () => {
    try {
      setSending(true);
      toast({
        title: "Generating Reports",
        description: "Creating personal activity reports for all sales team members...",
      });

      const { data, error } = await supabase.functions.invoke('send-personal-sales-reports');
      
      if (error) throw error;
      
      const currentTime = new Date().toLocaleString();
      setLastSent(currentTime);
      
      toast({
        title: "Reports Sent Successfully!",
        description: data.message || "All personal sales reports have been emailed.",
      });
      
      console.log("Reports sent:", data);
    } catch (error: any) {
      console.error("Error sending reports:", error);
      toast({
        title: "Error",
        description: "Failed to send reports: " + error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Personal Sales Reports</h1>
            <p className="text-muted-foreground mt-1">
              Generate and email daily activity reports for all sales team members
            </p>
          </div>
        </div>

        <div className="grid gap-6 max-w-4xl">
          {/* Main Action Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Generate & Email Reports
              </CardTitle>
              <CardDescription>
                Send personalized daily activity reports to each sales team member
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Automated Schedule:</strong> Reports are automatically generated and sent daily at 10:00 PM UAE time.
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h3 className="font-semibold text-sm">Report Recipients (per sales person):</h3>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• The sales person themselves</li>
                  <li>• sales1@tadmaids.com</li>
                  <li>• rami@tadmaids.com</li>
                  <li>• nour@tadmaids.com</li>
                </ul>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h3 className="font-semibold text-sm">Report Contents:</h3>
                
                <div className="mt-2">
                  <strong className="text-sm">Lead Pipeline Metrics:</strong>
                  <ul className="text-sm space-y-1 ml-4 mt-1">
                    <li>• Total Leads Taken (engaged with)</li>
                    <li>• Total Leads Assigned But Not Taken</li>
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm ml-4">
                  <div>
                    <strong>Daily Activities:</strong>
                    <ul className="mt-1 space-y-1">
                      <li>• Calls Made</li>
                      <li>• Messages Sent</li>
                      <li>• Moved to Warm</li>
                      <li>• Moved to Hot</li>
                    </ul>
                  </div>
                  <div>
                    <strong>&nbsp;</strong>
                    <ul className="mt-1 space-y-1">
                      <li>• Deals Created</li>
                      <li>• Notes Added</li>
                      <li>• Reminders Set</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-2">
                  <strong className="text-sm">Upcoming Reminders:</strong>
                  <p className="text-sm ml-4 mt-1">Shows leads scheduled for follow-up in the next 3 days</p>
                </div>

                <div className="mt-2">
                  <strong className="text-sm">Leads Needing Attention:</strong>
                  <p className="text-sm ml-4 mt-1">Lists all assigned leads that haven't been engaged with yet</p>
                </div>
              </div>

              {lastSent && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Last sent: {lastSent}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleSendReports}
                disabled={sending}
                size="lg"
                className="w-full"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating Reports...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Generate & Email All Reports Now
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong>1. Manual Trigger:</strong>
                <p className="text-muted-foreground mt-1">
                  Click the button above to immediately generate and send reports for all sales team members.
                </p>
              </div>
              <div>
                <strong>2. Automatic Daily Reports:</strong>
                <p className="text-muted-foreground mt-1">
                  Reports are automatically generated and emailed every day at 10:00 PM UAE time.
                </p>
              </div>
              <div>
                <strong>3. Individual Reports:</strong>
                <p className="text-muted-foreground mt-1">
                  Each sales person receives a personalized report showing only their activities and upcoming reminders.
                </p>
              </div>
              <div>
                <strong>4. Management Visibility:</strong>
                <p className="text-muted-foreground mt-1">
                  Management (sales1, rami, nour) receives copies of all reports for full team visibility.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SendPersonalReports;
