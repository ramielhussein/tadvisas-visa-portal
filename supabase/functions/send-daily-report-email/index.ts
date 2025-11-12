import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend("re_PchMak8p_Cf8gF3bankt4kaLpv2UsFsC2");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DailyReportData {
  todayDate: string;
  leadsAdded: number;
  leadsUpdated: number;
  freshLeadsTaken: number;
  totalLeadsTaken: number;
  activeStaff: number;
  staffActivities: Array<{
    staff_name: string;
    leads_added: number;
    leads_updated: number;
    leads_taken: number;
  }>;
  leadsBySource: Array<{
    source: string;
    count: number;
  }>;
  leadsByService: Array<{
    service: string;
    count: number;
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

    // Get today's date
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    // Fetch leads added today
    const { data: leadsAdded, error: leadsError } = await supabase
      .from("leads")
      .select("id")
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd);

    if (leadsError) throw leadsError;

    // Fetch leads updated today (but not created today)
    const { data: leadsUpdated, error: updatedError } = await supabase
      .from("leads")
      .select("id, created_at, updated_at")
      .gte("updated_at", todayStart)
      .lte("updated_at", todayEnd)
      .lt("created_at", todayStart);

    if (updatedError) throw updatedError;

    // Fetch leads taken (assigned) today
    const { data: leadsTaken, error: takenError } = await supabase
      .from("leads")
      .select("id")
      .not("assigned_to", "is", null)
      .gte("updated_at", todayStart)
      .lte("updated_at", todayEnd);

    if (takenError) throw takenError;

    // Build staff activity stats without FK joins
    const { data: createdLeadsByStaff, error: createdLeadsByStaffError } = await supabase
      .from("leads")
      .select("assigned_to")
      .not("assigned_to", "is", null)
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd);

    if (createdLeadsByStaffError) throw createdLeadsByStaffError;

    const { data: updatedLeadsByStaff, error: updatedLeadsByStaffError } = await supabase
      .from("leads")
      .select("assigned_to, created_at")
      .not("assigned_to", "is", null)
      .gte("updated_at", todayStart)
      .lte("updated_at", todayEnd)
      .lt("created_at", todayStart);

    if (updatedLeadsByStaffError) throw updatedLeadsByStaffError;

    const { data: takenLeadsByStaff, error: takenLeadsByStaffError } = await supabase
      .from("leads")
      .select("assigned_to")
      .not("assigned_to", "is", null)
      .gte("updated_at", todayStart)
      .lte("updated_at", todayEnd);

    if (takenLeadsByStaffError) throw takenLeadsByStaffError;

    const staffCounts = new Map<string, { added: number; updated: number; taken: number }>();

    for (const row of createdLeadsByStaff || []) {
      const id = row.assigned_to as string | null;
      if (!id) continue;
      const c = staffCounts.get(id) || { added: 0, updated: 0, taken: 0 };
      c.added += 1;
      staffCounts.set(id, c);
    }

    for (const row of updatedLeadsByStaff || []) {
      const id = row.assigned_to as string | null;
      if (!id) continue;
      const c = staffCounts.get(id) || { added: 0, updated: 0, taken: 0 };
      c.updated += 1;
      staffCounts.set(id, c);
    }

    for (const row of takenLeadsByStaff || []) {
      const id = row.assigned_to as string | null;
      if (!id) continue;
      const c = staffCounts.get(id) || { added: 0, updated: 0, taken: 0 };
      c.taken += 1;
      staffCounts.set(id, c);
    }

    const staffIds = Array.from(staffCounts.keys());

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", staffIds);

    if (profilesError) throw profilesError;

    const processedStaff = staffIds
      .map((id) => {
        const profile = profiles?.find((p: any) => p.id === id);
        const counts = staffCounts.get(id)!;
        return {
          staff_name: profile?.full_name || "Unknown",
          leads_added: counts.added,
          leads_updated: counts.updated,
          leads_taken: counts.taken,
        };
      })
      .filter((s) => s.leads_added > 0 || s.leads_updated > 0 || s.leads_taken > 0);

    // Fetch leads by source
    const { data: leadsBySource, error: sourceError } = await supabase
      .from("leads")
      .select("lead_source")
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd);

    if (sourceError) throw sourceError;

    const sourceCount = leadsBySource.reduce((acc: any, lead: any) => {
      const source = lead.lead_source || "Unknown";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    // Fetch leads by service
    const { data: leadsByService, error: serviceError } = await supabase
      .from("leads")
      .select("service_required")
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd);

    if (serviceError) throw serviceError;

    const serviceCount = leadsByService.reduce((acc: any, lead: any) => {
      const service = lead.service_required || "Unknown";
      acc[service] = (acc[service] || 0) + 1;
      return acc;
    }, {});

    const reportData: DailyReportData = {
      todayDate: today.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      leadsAdded: leadsAdded?.length || 0,
      leadsUpdated: leadsUpdated?.length || 0,
      freshLeadsTaken: createdLeadsByStaff?.length || 0,
      totalLeadsTaken: takenLeadsByStaff?.length || 0,
      activeStaff: processedStaff.length,
      staffActivities: processedStaff,
      leadsBySource: Object.entries(sourceCount).map(([source, count]) => ({
        source,
        count: count as number,
      })),
      leadsByService: Object.entries(serviceCount).map(([service, count]) => ({
        service,
        count: count as number,
      })),
    };

    // Generate HTML email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin: 20px 0; }
            .summary-card { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
            .summary-card h3 { margin: 0; color: #6b7280; font-size: 14px; }
            .summary-card p { margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #2563eb; }
            .summary-card small { display: block; margin-top: 5px; font-size: 11px; color: #6b7280; }
            .section { margin: 20px 0; }
            .section h2 { color: #1f2937; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background: #f9fafb; font-weight: 600; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Daily Lead Attendance Report</h1>
              <p>${reportData.todayDate}</p>
            </div>
            
            <div class="summary">
              <div class="summary-card">
                <h3>Leads Added</h3>
                <p>${reportData.leadsAdded}</p>
              </div>
              <div class="summary-card">
                <h3>Leads Updated</h3>
                <p>${reportData.leadsUpdated}</p>
              </div>
              <div class="summary-card">
                <h3>Fresh Leads Taken</h3>
                <p>${reportData.freshLeadsTaken}</p>
                <small>${reportData.leadsAdded > 0 ? ((reportData.freshLeadsTaken / reportData.leadsAdded) * 100).toFixed(1) : '0'}% of new leads</small>
              </div>
              <div class="summary-card">
                <h3>Total Leads Taken</h3>
                <p>${reportData.totalLeadsTaken}</p>
                <small>${(reportData.leadsAdded + reportData.leadsUpdated) > 0 ? ((reportData.totalLeadsTaken / (reportData.leadsAdded + reportData.leadsUpdated)) * 100).toFixed(1) : '0'}% of all leads</small>
              </div>
              <div class="summary-card">
                <h3>Active Staff</h3>
                <p>${reportData.activeStaff}</p>
              </div>
            </div>

            <div class="section">
              <h2>Staff Activity Breakdown</h2>
              <table>
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Leads Added</th>
                    <th>Leads Updated</th>
                    <th>Leads Taken</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportData.staffActivities.map(staff => `
                    <tr>
                      <td>${staff.staff_name}</td>
                      <td>${staff.leads_added}</td>
                      <td>${staff.leads_updated}</td>
                      <td>${staff.leads_taken}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2>Leads by Source</h2>
              <table>
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportData.leadsBySource.map(item => `
                    <tr>
                      <td>${item.source}</td>
                      <td>${item.count}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2>Leads by Service</h2>
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportData.leadsByService.map(item => `
                    <tr>
                      <td>${item.service}</td>
                      <td>${item.count}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>

            <div class="footer">
              <p>This is an automated daily report generated by your CRM system.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "CRM Reports <reports@tadvisas.com>",
      to: ["sales1@tadmaids.com", "rami@tadmaids.com", "nour@tadmaids.com", "nawar@tadmaids.com"],
      subject: `Lead Attendance Report - ${reportData.todayDate}`,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: reportData, emailId: emailResponse.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-daily-report-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
