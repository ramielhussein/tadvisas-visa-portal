import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend("re_PchMak8p_Cf8gF3bankt4kaLpv2UsFsC2");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PersonalReportData {
  salesPersonName: string;
  salesPersonEmail: string;
  todayDate: string;
  leadMetrics: {
    totalLeadsTaken: number;
    totalLeadsAssignedNotTaken: number;
  };
  activities: {
    callsMade: number;
    messagesSent: number;
    movedToWarm: number;
    movedToHot: number;
    dealsCreated: number;
    notesAdded: number;
    remindersSet: number;
  };
  upcomingReminders: Array<{
    lead_name: string;
    status: string;
    remind_date: string;
    days_until: number;
    mobile_number: string;
    last_activity: string;
  }>;
  untakenLeads: Array<{
    lead_name: string;
    mobile_number: string;
    assigned_date: string;
    status: string;
    lead_source: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get today's date range
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    // Get all users with sales ROLE from user_roles table (not all profiles!)
    const { data: salesRoleUsers, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "sales");

    if (rolesError) throw rolesError;

    if (!salesRoleUsers || salesRoleUsers.length === 0) {
      console.log("No users with sales role found");
      return new Response(
        JSON.stringify({ success: true, message: "No sales users to send reports to" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const salesUserIds = salesRoleUsers.map(r => r.user_id);

    // Get profile info for sales users only
    const { data: salesPeople, error: salesError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", salesUserIds)
      .not("email", "is", null);

    if (salesError) throw salesError;

    console.log(`Generating reports for ${salesPeople?.length || 0} sales people with sales role`);

    // Generate report for each sales person
    for (const person of salesPeople || []) {
      try {
        // Fetch all assigned leads to calculate metrics
        const { data: allAssignedLeads, error: leadsError } = await supabase
          .from("leads")
          .select("id, client_name, mobile_number, created_at, status, lead_source")
          .eq("assigned_to", person.id)
          .eq("archived", false);

        if (leadsError) throw leadsError;

        // Get all activity lead IDs for this person to determine engagement
        const { data: allActivities, error: allActError } = await supabase
          .from("lead_activities")
          .select("lead_id")
          .eq("user_id", person.id);

        if (allActError) throw allActError;

        const engagedLeadIds = new Set(allActivities?.map(a => a.lead_id) || []);
        
        // Separate leads into taken and not taken
        const totalLeadsTaken = allAssignedLeads?.filter(lead => engagedLeadIds.has(lead.id)).length || 0;
        const untakenLeadsData = allAssignedLeads?.filter(lead => !engagedLeadIds.has(lead.id)) || [];

        // Fetch today's activities for this person
        const { data: activities, error: actError } = await supabase
          .from("lead_activities")
          .select("activity_type, activity_subtype")
          .eq("user_id", person.id)
          .gte("created_at", todayStart)
          .lte("created_at", todayEnd);

        if (actError) throw actError;

        // Count activities by type
        const callsMade = activities?.filter(a => a.activity_type === "call").length || 0;
        const messagesSent = activities?.filter(a => 
          a.activity_type === "message" || a.activity_subtype === "whatsapp"
        ).length || 0;
        const movedToWarm = activities?.filter(a => 
          a.activity_subtype === "moved_to_warm"
        ).length || 0;
        const movedToHot = activities?.filter(a => 
          a.activity_subtype === "moved_to_hot"
        ).length || 0;
        const dealsCreated = activities?.filter(a => 
          a.activity_type === "deal_created" || a.activity_subtype === "converted"
        ).length || 0;
        const notesAdded = activities?.filter(a => a.activity_type === "note").length || 0;
        const remindersSet = activities?.filter(a => 
          a.activity_type === "reminder_set"
        ).length || 0;

        // Get upcoming reminders (next 3 days)
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const { data: upcomingLeads, error: remindersError } = await supabase
          .from("leads")
          .select("client_name, status, remind_me, mobile_number, updated_at")
          .eq("assigned_to", person.id)
          .gte("remind_me", today.toISOString().split('T')[0])
          .lte("remind_me", threeDaysFromNow.toISOString().split('T')[0])
          .order("remind_me", { ascending: true });

        if (remindersError) throw remindersError;

        // Format upcoming reminders
        const upcomingReminders = (upcomingLeads || []).map(lead => {
          const remindDate = new Date(lead.remind_me);
          const daysUntil = Math.ceil((remindDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const lastActivity = new Date(lead.updated_at).toLocaleDateString();

          return {
            lead_name: lead.client_name || "Unknown",
            status: lead.status,
            remind_date: remindDate.toLocaleDateString(),
            days_until: daysUntil,
            mobile_number: lead.mobile_number,
            last_activity: lastActivity,
          };
        });

        const reportData: PersonalReportData = {
          salesPersonName: person.full_name || person.email,
          salesPersonEmail: person.email,
          todayDate: today.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          leadMetrics: {
            totalLeadsTaken,
            totalLeadsAssignedNotTaken: untakenLeadsData.length,
          },
          activities: {
            callsMade,
            messagesSent,
            movedToWarm,
            movedToHot,
            dealsCreated,
            notesAdded,
            remindersSet,
          },
          upcomingReminders,
          untakenLeads: untakenLeadsData.map(lead => ({
            lead_name: lead.client_name || "Unknown",
            mobile_number: lead.mobile_number,
            assigned_date: new Date(lead.created_at).toLocaleDateString(),
            status: lead.status,
            lead_source: lead.lead_source || "Unknown",
          })),
        };

        // Generate HTML email
        const htmlContent = generateEmailHTML(reportData);

        // Send email to sales person + management
        const recipients = [
          person.email,
          "sales1@tadmaids.com",
          "rami@tadmaids.com",
          "nour@tadmaids.com",
        ];

        const emailResponse = await resend.emails.send({
          from: "Sales Reports <reports@tadvisas.com>",
          to: recipients,
          subject: `Daily Sales Activity Report - ${reportData.todayDate}`,
          html: htmlContent,
        });

        console.log(`Report sent for ${person.full_name}:`, emailResponse.id);
      } catch (personError: any) {
        console.error(`Error generating report for ${person.full_name}:`, personError);
        // Continue with other people even if one fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated reports for ${salesPeople?.length || 0} sales people` 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-personal-sales-reports:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

function generateEmailHTML(data: PersonalReportData): string {
  const totalActivities = Object.values(data.activities).reduce((sum, val) => sum + val, 0);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .greeting { font-size: 18px; margin-bottom: 10px; }
          .metrics { background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
          .metric-card { background: white; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #2563eb; }
          .metric-card.warning { border-left-color: #f59e0b; background: #fffbeb; }
          .metric-card h3 { margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; }
          .metric-card p { margin: 10px 0 0 0; font-size: 36px; font-weight: bold; color: #2563eb; }
          .metric-card.warning p { color: #f59e0b; }
          .summary { background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .summary h2 { margin: 0 0 15px 0; color: #1f2937; }
          .activity-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
          .activity-card { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; }
          .activity-card h3 { margin: 0; font-size: 14px; color: #6b7280; }
          .activity-card p { margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #10b981; }
          .section { margin: 20px 0; }
          .section h2 { color: #1f2937; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: 600; }
          .urgent { color: #dc2626; font-weight: bold; }
          .soon { color: #f59e0b; }
          .untaken-warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; }
          .no-data { text-align: center; padding: 20px; color: #6b7280; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <p class="greeting">Hi ${data.salesPersonName}!</p>
            <h1>Your Daily Sales Activity Report</h1>
            <p>${data.todayDate}</p>
          </div>
          
          <div class="metrics">
            <h2>📊 Lead Pipeline Overview</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <h3>Total Leads Taken</h3>
                <p>${data.leadMetrics.totalLeadsTaken}</p>
                <small style="color: #6b7280;">Leads you've engaged with</small>
              </div>
              <div class="metric-card warning">
                <h3>Leads Assigned But Not Taken</h3>
                <p>${data.leadMetrics.totalLeadsAssignedNotTaken}</p>
                <small style="color: #92400e;">Need your attention!</small>
              </div>
            </div>
          </div>

          <div class="summary">
            <h2>Today's Activity Summary</h2>
            <p style="font-size: 16px; margin-bottom: 15px;">
              Total Activities: <strong>${totalActivities}</strong>
            </p>
            
            <div class="activity-grid">
              <div class="activity-card">
                <h3>Calls Made</h3>
                <p>${data.activities.callsMade}</p>
              </div>
              <div class="activity-card">
                <h3>Messages Sent</h3>
                <p>${data.activities.messagesSent}</p>
              </div>
              <div class="activity-card">
                <h3>Moved to Warm</h3>
                <p>${data.activities.movedToWarm}</p>
              </div>
              <div class="activity-card">
                <h3>Moved to Hot</h3>
                <p>${data.activities.movedToHot}</p>
              </div>
              <div class="activity-card">
                <h3>Deals Created</h3>
                <p>${data.activities.dealsCreated}</p>
              </div>
              <div class="activity-card">
                <h3>Notes Added</h3>
                <p>${data.activities.notesAdded}</p>
              </div>
              <div class="activity-card">
                <h3>Reminders Set</h3>
                <p>${data.activities.remindersSet}</p>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>📅 Upcoming Reminders (Next 3 Days)</h2>
            ${data.upcomingReminders.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>Lead Name</th>
                    <th>Status</th>
                    <th>Phone</th>
                    <th>Follow-up Date</th>
                    <th>Days Until</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.upcomingReminders.map(reminder => `
                    <tr>
                      <td>${reminder.lead_name}</td>
                      <td>${reminder.status}</td>
                      <td>${reminder.mobile_number}</td>
                      <td>${reminder.remind_date}</td>
                      <td class="${reminder.days_until === 0 ? 'urgent' : reminder.days_until === 1 ? 'soon' : ''}">
                        ${reminder.days_until === 0 ? 'TODAY!' : reminder.days_until === 1 ? 'Tomorrow' : `In ${reminder.days_until} days`}
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            ` : `
              <div class="no-data">
                No upcoming reminders for the next 3 days.
              </div>
            `}
          </div>

          ${data.untakenLeads.length > 0 ? `
          <div class="section">
            <h2>⚠️ Leads Assigned But Not Yet Engaged (${data.untakenLeads.length})</h2>
            <p style="color: #dc2626; margin-bottom: 15px;">These leads have been assigned to you but haven't been contacted yet. Take action soon!</p>
            <table>
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Phone</th>
                  <th>Assigned Date</th>
                  <th>Status</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                ${data.untakenLeads.map(lead => `
                  <tr>
                    <td>${lead.lead_name}</td>
                    <td>${lead.mobile_number}</td>
                    <td>${lead.assigned_date}</td>
                    <td>${lead.status}</td>
                    <td>${lead.lead_source}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="footer">
            <p>This is an automated daily report generated by your CRM system.</p>
            <p><small>Keep up the great work!</small></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

serve(handler);
