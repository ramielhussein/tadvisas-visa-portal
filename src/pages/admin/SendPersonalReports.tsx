import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Send, Clock, CheckCircle, FileDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import html2pdf from "html2pdf.js";

const SendPersonalReports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
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

  const handleGeneratePDFs = async () => {
    try {
      setGeneratingPDF(true);
      toast({
        title: "Generating PDFs",
        description: "Creating PDF reports for all sales team members...",
      });

      // Fetch all sales team members
      const { data: salesPeople, error: salesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .not("email", "is", null);

      if (salesError) throw salesError;

      const today = new Date();
      const todayDate = today.toISOString().split('T')[0];
      
      // Generate PDF for each salesperson
      for (const person of salesPeople || []) {
        // Fetch their data
        const { data: allAssignedLeads, error: leadsError } = await supabase
          .from('leads')
          .select('id, client_name, mobile_number, created_at, status, lead_source')
          .eq('assigned_to', person.id)
          .eq('archived', false);

        if (leadsError) continue;

        // Get engaged leads
        const { data: allActivities } = await supabase
          .from('lead_activities')
          .select('lead_id')
          .eq('user_id', person.id);

        const engagedLeadIds = new Set(allActivities?.map(a => a.lead_id) || []);
        const totalLeadsTaken = allAssignedLeads?.filter(lead => engagedLeadIds.has(lead.id)).length || 0;
        const untakenLeads = allAssignedLeads?.filter(lead => !engagedLeadIds.has(lead.id)) || [];

        // Get today's activities
        const { data: activities } = await supabase
          .from('lead_activities')
          .select('*')
          .eq('user_id', person.id)
          .gte('created_at', `${todayDate}T00:00:00`)
          .lte('created_at', `${todayDate}T23:59:59`);

        const activityCounts = {
          callsMade: activities?.filter(a => a.activity_type === 'call').length || 0,
          messagesSent: activities?.filter(a => a.activity_type === 'message').length || 0,
          movedToWarm: activities?.filter(a => a.activity_type === 'status_change' && a.activity_subtype === 'moved_to_warm').length || 0,
          movedToHot: activities?.filter(a => a.activity_type === 'status_change' && a.activity_subtype === 'moved_to_hot').length || 0,
          dealsCreated: activities?.filter(a => a.activity_type === 'deal_created').length || 0,
          notesAdded: activities?.filter(a => a.activity_type === 'note').length || 0,
          remindersSet: activities?.filter(a => a.activity_type === 'reminder_set').length || 0,
        };

        // Get upcoming reminders
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        const { data: reminders } = await supabase
          .from('leads')
          .select('client_name, mobile_number, remind_me, status')
          .eq('assigned_to', person.id)
          .not('remind_me', 'is', null)
          .gte('remind_me', todayDate)
          .lte('remind_me', threeDaysFromNow.toISOString().split('T')[0])
          .order('remind_me', { ascending: true });

        // Create HTML for PDF
        const htmlContent = generateReportHTML(person, {
          totalLeadsTaken,
          untakenLeadsCount: untakenLeads.length,
          activityCounts,
          reminders: reminders || [],
          untakenLeads: untakenLeads.map(lead => ({
            client_name: lead.client_name || 'No name',
            mobile_number: lead.mobile_number,
            created_at: new Date(lead.created_at).toLocaleDateString('en-US'),
            status: lead.status,
            lead_source: lead.lead_source || 'Unknown',
          })),
        });

        // Convert to PDF
        const element = document.createElement('div');
        element.innerHTML = htmlContent;
        element.style.padding = '20px';
        document.body.appendChild(element);

        const opt = {
          margin: 10,
          filename: `sales-report-${person.full_name?.replace(/\s+/g, '-') || person.email}-${todayDate}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        };

        await html2pdf().set(opt).from(element).save();
        document.body.removeChild(element);
        
        // Small delay between PDFs
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast({
        title: "PDFs Generated Successfully!",
        description: `Generated ${salesPeople?.length || 0} PDF reports.`,
      });
    } catch (error: any) {
      console.error("Error generating PDFs:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDFs: " + error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const generateReportHTML = (person: any, data: any) => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px;">
          <h1 style="margin: 0 0 10px 0;">Daily Sales Activity Report</h1>
          <h2 style="margin: 0; font-weight: normal;">${person.full_name || person.email}</h2>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div style="margin: 30px 0;">
          <h3 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Lead Pipeline Overview</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">Total Leads Taken</div>
              <div style="font-size: 36px; font-weight: bold; color: #667eea;">${data.totalLeadsTaken}</div>
            </div>
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="font-size: 14px; color: #92400e; margin-bottom: 10px;">Leads Not Yet Engaged</div>
              <div style="font-size: 36px; font-weight: bold; color: #f59e0b;">${data.untakenLeadsCount}</div>
            </div>
          </div>
        </div>

        <div style="margin: 30px 0;">
          <h3 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Today's Activity Summary</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 20px;">
            <div style="background: #f3f4f6; padding: 15px; border-radius: 6px;">
              <div style="font-size: 12px; color: #6b7280;">CALLS MADE</div>
              <div style="font-size: 24px; font-weight: bold;">${data.activityCounts.callsMade}</div>
            </div>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 6px;">
              <div style="font-size: 12px; color: #6b7280;">MESSAGES SENT</div>
              <div style="font-size: 24px; font-weight: bold;">${data.activityCounts.messagesSent}</div>
            </div>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 6px;">
              <div style="font-size: 12px; color: #6b7280;">MOVED TO WARM</div>
              <div style="font-size: 24px; font-weight: bold;">${data.activityCounts.movedToWarm}</div>
            </div>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 6px;">
              <div style="font-size: 12px; color: #6b7280;">MOVED TO HOT</div>
              <div style="font-size: 24px; font-weight: bold;">${data.activityCounts.movedToHot}</div>
            </div>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 6px;">
              <div style="font-size: 12px; color: #6b7280;">DEALS CREATED</div>
              <div style="font-size: 24px; font-weight: bold;">${data.activityCounts.dealsCreated}</div>
            </div>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 6px;">
              <div style="font-size: 12px; color: #6b7280;">NOTES ADDED</div>
              <div style="font-size: 24px; font-weight: bold;">${data.activityCounts.notesAdded}</div>
            </div>
          </div>
        </div>

        ${data.reminders.length > 0 ? `
        <div style="margin: 30px 0;">
          <h3 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Upcoming Reminders</h3>
          ${data.reminders.map((r: any) => `
            <div style="background: #fef3c7; padding: 12px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #f59e0b;">
              <strong>${r.client_name || 'No Name'}</strong> - ${r.mobile_number}<br>
              <span style="font-size: 12px;">Follow up: ${new Date(r.remind_me).toLocaleDateString('en-US')} | Status: ${r.status}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${data.untakenLeads.length > 0 ? `
        <div style="margin: 30px 0; page-break-before: always;">
          <h3 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">Leads Needing Attention (${data.untakenLeads.length})</h3>
          ${data.untakenLeads.map((lead: any) => `
            <div style="background: #fee2e2; padding: 12px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #dc2626;">
              <strong>${lead.client_name}</strong> - ${lead.mobile_number}<br>
              <span style="font-size: 12px;">Assigned: ${lead.created_at} | Status: ${lead.status} | Source: ${lead.lead_source}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
    `;
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={handleSendReports}
                  disabled={sending || generatingPDF}
                  size="lg"
                  className="w-full"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sending Emails...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Generate & Email All Reports
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleGeneratePDFs}
                  disabled={sending || generatingPDF}
                  size="lg"
                  variant="outline"
                  className="w-full"
                >
                  {generatingPDF ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      Generating PDFs...
                    </>
                  ) : (
                    <>
                      <FileDown className="mr-2 h-4 w-4" />
                      Generate & Download PDFs
                    </>
                  )}
                </Button>
              </div>
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
