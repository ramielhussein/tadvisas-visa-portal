import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderLead {
  id: string;
  client_name: string | null;
  mobile_number: string;
  remind_me: string;
  status: string;
  comments: string | null;
  service_required: string | null;
  emirate: string | null;
  lead_source: string | null;
  assigned_to: string;
}

interface Activity {
  title: string;
  description: string | null;
  activity_type: string;
  created_at: string;
}

interface SalesPerson {
  id: string;
  email: string;
  full_name: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    // Get all sales users
    const { data: salesUsers, error: usersError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "sales");

    if (usersError) throw usersError;

    const salesUserIds = salesUsers?.map((u) => u.user_id) || [];

    // Get profiles for sales users
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", salesUserIds);

    if (profilesError) throw profilesError;

    const emailsSent: string[] = [];

    for (const profile of profiles || []) {
      if (!profile.email) continue;

      // Get overdue reminders (past dates)
      const { data: overdueLeads, error: overdueError } = await supabase
        .from("leads")
        .select("id, client_name, mobile_number, remind_me, status, comments, service_required, emirate, lead_source, assigned_to")
        .eq("assigned_to", profile.id)
        .eq("archived", false)
        .not("status", "in", '("Sold","Lost")')
        .lt("remind_me", todayStr)
        .not("remind_me", "is", null)
        .order("remind_me", { ascending: true });

      if (overdueError) {
        console.error(`Error fetching overdue leads for ${profile.email}:`, overdueError);
        continue;
      }

      // Get reminders due today
      const { data: todayLeads, error: todayError } = await supabase
        .from("leads")
        .select("id, client_name, mobile_number, remind_me, status, comments, service_required, emirate, lead_source, assigned_to")
        .eq("assigned_to", profile.id)
        .eq("archived", false)
        .not("status", "in", '("Sold","Lost")')
        .eq("remind_me", todayStr);

      if (todayError) {
        console.error(`Error fetching today leads for ${profile.email}:`, todayError);
        continue;
      }

      const allReminders = [...(overdueLeads || []), ...(todayLeads || [])];

      if (allReminders.length === 0) {
        console.log(`No reminders for ${profile.email}`);
        continue;
      }

      // Get activity history for each lead
      const leadIds = allReminders.map((l) => l.id);
      const { data: activities, error: activitiesError } = await supabase
        .from("lead_activities")
        .select("lead_id, title, description, activity_type, created_at")
        .in("lead_id", leadIds)
        .order("created_at", { ascending: false });

      if (activitiesError) {
        console.error(`Error fetching activities:`, activitiesError);
      }

      // Group activities by lead
      const activitiesByLead: Record<string, Activity[]> = {};
      for (const activity of activities || []) {
        if (!activitiesByLead[activity.lead_id]) {
          activitiesByLead[activity.lead_id] = [];
        }
        // Limit to last 5 activities per lead
        if (activitiesByLead[activity.lead_id].length < 5) {
          activitiesByLead[activity.lead_id].push(activity);
        }
      }

      // Generate email HTML
      const emailHtml = generateEmailHtml(
        profile.full_name || profile.email,
        overdueLeads || [],
        todayLeads || [],
        activitiesByLead
      );

      // Send email
      const { error: emailError } = await resend.emails.send({
        from: "TAD Maids CRM <notifications@tadmaids.com>",
        to: [profile.email],
        subject: `🔔 ${allReminders.length} Lead Reminder${allReminders.length > 1 ? "s" : ""} Need Your Attention`,
        html: emailHtml,
      });

      if (emailError) {
        console.error(`Error sending email to ${profile.email}:`, emailError);
      } else {
        console.log(`Email sent to ${profile.email} with ${allReminders.length} reminders`);
        emailsSent.push(profile.email);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        message: `Sent reminder emails to ${emailsSent.length} users`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-reminder-emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

function generateEmailHtml(
  userName: string,
  overdueLeads: ReminderLead[],
  todayLeads: ReminderLead[],
  activitiesByLead: Record<string, Activity[]>
): string {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatActivityDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const renderLeadCard = (lead: ReminderLead, isOverdue: boolean) => {
    const activities = activitiesByLead[lead.id] || [];
    const priorityColor = isOverdue ? "#dc2626" : "#f59e0b";
    const priorityLabel = isOverdue ? "OVERDUE" : "DUE TODAY";

    return `
      <div style="background: #ffffff; border-radius: 8px; padding: 16px; margin-bottom: 16px; border-left: 4px solid ${priorityColor}; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="margin: 0; color: #1f2937; font-size: 16px;">${lead.client_name || "Unknown Client"}</h3>
          <span style="background: ${priorityColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${priorityLabel}</span>
        </div>
        
        <div style="font-size: 14px; color: #4b5563; margin-bottom: 8px;">
          <div style="margin-bottom: 4px;">📱 <strong>${lead.mobile_number}</strong></div>
          <div style="margin-bottom: 4px;">📅 Reminder: ${formatDate(lead.remind_me)}</div>
          ${lead.service_required ? `<div style="margin-bottom: 4px;">🏷️ Service: ${lead.service_required}</div>` : ""}
          ${lead.emirate ? `<div style="margin-bottom: 4px;">📍 ${lead.emirate}</div>` : ""}
          <div style="margin-bottom: 4px;">📊 Status: <strong>${lead.status}</strong></div>
        </div>
        
        ${lead.comments ? `
          <div style="background: #fef3c7; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px;">
            <strong style="color: #92400e; font-size: 12px;">📝 Notes:</strong>
            <p style="margin: 4px 0 0 0; color: #78350f; font-size: 13px;">${lead.comments}</p>
          </div>
        ` : ""}
        
        ${activities.length > 0 ? `
          <div style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
            <strong style="color: #6b7280; font-size: 12px;">📋 Recent Activity:</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 16px; color: #6b7280; font-size: 12px;">
              ${activities.map((a) => `
                <li style="margin-bottom: 4px;">
                  <span style="color: #374151;">${a.title}</span>
                  <span style="color: #9ca3af;"> - ${formatActivityDate(a.created_at)}</span>
                </li>
              `).join("")}
            </ul>
          </div>
        ` : ""}
      </div>
    `;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0 0 8px 0; font-size: 24px;">Lead Reminders</h1>
          <p style="margin: 0; opacity: 0.9;">Good morning, ${userName}!</p>
        </div>
        
        <div style="background: #ffffff; padding: 24px; border-radius: 0 0 8px 8px;">
          <p style="color: #4b5563; margin-top: 0;">You have <strong>${overdueLeads.length + todayLeads.length}</strong> lead${overdueLeads.length + todayLeads.length > 1 ? "s" : ""} that need your attention today:</p>
          
          ${overdueLeads.length > 0 ? `
            <div style="margin-bottom: 24px;">
              <h2 style="color: #dc2626; font-size: 16px; margin-bottom: 12px; display: flex; align-items: center;">
                🚨 Overdue (${overdueLeads.length})
              </h2>
              ${overdueLeads.map((lead) => renderLeadCard(lead, true)).join("")}
            </div>
          ` : ""}
          
          ${todayLeads.length > 0 ? `
            <div>
              <h2 style="color: #f59e0b; font-size: 16px; margin-bottom: 12px;">
                ⏰ Due Today (${todayLeads.length})
              </h2>
              ${todayLeads.map((lead) => renderLeadCard(lead, false)).join("")}
            </div>
          ` : ""}
          
          <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <a href="https://tad-maids-crm.lovable.app/lead-management" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
              Open CRM Dashboard
            </a>
          </div>
        </div>
        
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
          TAD Maids CRM • ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
    </body>
    </html>
  `;
}

serve(handler);
