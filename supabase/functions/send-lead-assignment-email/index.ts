import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AssignmentRequest {
  lead_id: string;
  new_assignee_id: string;
  old_assignee_id?: string;
  is_reassignment: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { lead_id, new_assignee_id, old_assignee_id, is_reassignment }: AssignmentRequest = await req.json();

    console.log(`Processing assignment email for lead ${lead_id} to user ${new_assignee_id}`);

    // Get lead details
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      throw new Error(`Lead not found: ${leadError?.message}`);
    }

    // Get new assignee profile
    const { data: newAssignee, error: newAssigneeError } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", new_assignee_id)
      .single();

    if (newAssigneeError || !newAssignee?.email) {
      throw new Error(`New assignee not found or has no email: ${newAssigneeError?.message}`);
    }

    // Get old assignee profile if this is a reassignment
    let oldAssigneeName = null;
    if (is_reassignment && old_assignee_id) {
      const { data: oldAssignee } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", old_assignee_id)
        .single();
      oldAssigneeName = oldAssignee?.full_name || oldAssignee?.email || "Unknown";
    }

    // Get recent activities
    const { data: activities } = await supabase
      .from("lead_activities")
      .select("title, description, activity_type, created_at")
      .eq("lead_id", lead_id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Generate email HTML
    const emailHtml = generateAssignmentEmailHtml(
      newAssignee.full_name || newAssignee.email,
      lead,
      activities || [],
      is_reassignment,
      oldAssigneeName
    );

    const subject = is_reassignment
      ? `🔄 Lead Re-assigned: ${lead.client_name || lead.mobile_number}`
      : `📥 New Lead Assigned: ${lead.client_name || lead.mobile_number}`;

    // Send email to new assignee
    const { error: emailError } = await resend.emails.send({
      from: "TAD Maids CRM <notifications@tadmaids.com>",
      to: [newAssignee.email],
      subject,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      throw emailError;
    }

    console.log(`Assignment email sent to ${newAssignee.email}`);

    return new Response(
      JSON.stringify({ success: true, message: `Email sent to ${newAssignee.email}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-lead-assignment-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

function generateAssignmentEmailHtml(
  userName: string,
  lead: any,
  activities: any[],
  isReassignment: boolean,
  oldAssigneeName: string | null
): string {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatActivityDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const headerColor = isReassignment ? "#f59e0b" : "#10b981";
  const headerIcon = isReassignment ? "🔄" : "📥";
  const headerText = isReassignment ? "Lead Re-assigned to You" : "New Lead Assigned";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, ${headerColor} 0%, ${headerColor}dd 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0 0 8px 0; font-size: 24px;">${headerIcon} ${headerText}</h1>
          <p style="margin: 0; opacity: 0.9;">Hi ${userName}!</p>
        </div>
        
        <div style="background: #ffffff; padding: 24px; border-radius: 0 0 8px 8px;">
          ${isReassignment && oldAssigneeName ? `
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-bottom: 20px; border-radius: 0 4px 4px 0;">
              <strong style="color: #92400e;">Previously handled by:</strong>
              <span style="color: #78350f;"> ${oldAssigneeName}</span>
            </div>
          ` : ""}
          
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; border-bottom: 2px solid ${headerColor}; padding-bottom: 8px;">
              Lead Details
            </h2>
            
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; align-items: center;">
                <span style="width: 24px; text-align: center;">👤</span>
                <strong style="min-width: 100px; color: #6b7280;">Client:</strong>
                <span style="color: #1f2937;">${lead.client_name || "Not provided"}</span>
              </div>
              
              <div style="display: flex; align-items: center;">
                <span style="width: 24px; text-align: center;">📱</span>
                <strong style="min-width: 100px; color: #6b7280;">Phone:</strong>
                <a href="tel:${lead.mobile_number}" style="color: #2563eb; text-decoration: none;">${lead.mobile_number}</a>
              </div>
              
              ${lead.email ? `
                <div style="display: flex; align-items: center;">
                  <span style="width: 24px; text-align: center;">✉️</span>
                  <strong style="min-width: 100px; color: #6b7280;">Email:</strong>
                  <a href="mailto:${lead.email}" style="color: #2563eb; text-decoration: none;">${lead.email}</a>
                </div>
              ` : ""}
              
              <div style="display: flex; align-items: center;">
                <span style="width: 24px; text-align: center;">📊</span>
                <strong style="min-width: 100px; color: #6b7280;">Status:</strong>
                <span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 13px;">${lead.status}</span>
                ${lead.hot ? '<span style="background: #fef2f2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-size: 13px; margin-left: 8px;">🔥 HOT</span>' : ""}
              </div>
              
              ${lead.service_required ? `
                <div style="display: flex; align-items: center;">
                  <span style="width: 24px; text-align: center;">🏷️</span>
                  <strong style="min-width: 100px; color: #6b7280;">Service:</strong>
                  <span style="color: #1f2937;">${lead.service_required}</span>
                </div>
              ` : ""}
              
              ${lead.emirate ? `
                <div style="display: flex; align-items: center;">
                  <span style="width: 24px; text-align: center;">📍</span>
                  <strong style="min-width: 100px; color: #6b7280;">Emirate:</strong>
                  <span style="color: #1f2937;">${lead.emirate}</span>
                </div>
              ` : ""}
              
              ${lead.lead_source ? `
                <div style="display: flex; align-items: center;">
                  <span style="width: 24px; text-align: center;">📣</span>
                  <strong style="min-width: 100px; color: #6b7280;">Source:</strong>
                  <span style="color: #1f2937;">${lead.lead_source}</span>
                </div>
              ` : ""}
              
              ${lead.remind_me ? `
                <div style="display: flex; align-items: center;">
                  <span style="width: 24px; text-align: center;">⏰</span>
                  <strong style="min-width: 100px; color: #6b7280;">Reminder:</strong>
                  <span style="color: #1f2937;">${formatDate(lead.remind_me)}</span>
                </div>
              ` : ""}
            </div>
          </div>
          
          ${lead.comments ? `
            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <strong style="color: #92400e; display: block; margin-bottom: 8px;">📝 Notes:</strong>
              <p style="margin: 0; color: #78350f; white-space: pre-wrap;">${lead.comments}</p>
            </div>
          ` : ""}
          
          ${activities.length > 0 ? `
            <div style="margin-bottom: 20px;">
              <h3 style="color: #374151; font-size: 16px; margin-bottom: 12px; display: flex; align-items: center;">
                📋 Activity History (Last ${activities.length})
              </h3>
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                ${activities.map((activity, index) => `
                  <div style="padding: 12px 16px; ${index < activities.length - 1 ? "border-bottom: 1px solid #e5e7eb;" : ""} background: ${index % 2 === 0 ? "#ffffff" : "#f9fafb"};">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                      <div>
                        <strong style="color: #1f2937; font-size: 14px;">${activity.title}</strong>
                        ${activity.description ? `<p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">${activity.description}</p>` : ""}
                      </div>
                      <span style="color: #9ca3af; font-size: 12px; white-space: nowrap; margin-left: 12px;">${formatActivityDate(activity.created_at)}</span>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          ` : ""}
          
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <a href="https://tad-maids-crm.lovable.app/lead/${lead.id}" style="display: inline-block; background: ${headerColor}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Open Lead Details →
            </a>
            <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 13px;">
              <a href="https://wa.me/${lead.mobile_number.replace(/[^0-9]/g, "")}" style="color: #22c55e; text-decoration: none;">💬 WhatsApp</a>
              &nbsp;•&nbsp;
              <a href="tel:${lead.mobile_number}" style="color: #2563eb; text-decoration: none;">📞 Call</a>
            </p>
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
