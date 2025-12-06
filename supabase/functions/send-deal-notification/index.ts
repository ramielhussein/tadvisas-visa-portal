import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fixed recipients for deal notifications
const NOTIFICATION_RECIPIENTS = [
  "accounts@tadmaids.com",
  "hr@tadmaids.com",
  "rami@tadmaids.com",
  "nour@tadmaids.com",
];

interface DealNotificationRequest {
  type: "deal_activated" | "payment_reminder";
  deal_id?: string;
  // For batch reminder processing
  check_all_reminders?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, deal_id, check_all_reminders }: DealNotificationRequest = await req.json();

    console.log(`Processing notification request: type=${type}, deal_id=${deal_id}, check_all=${check_all_reminders}`);

    if (type === "deal_activated" && deal_id) {
      // Fetch deal details
      const { data: deal, error: dealError } = await supabase
        .from("deals")
        .select("*")
        .eq("id", deal_id)
        .single();

      if (dealError || !deal) {
        console.error("Error fetching deal:", dealError);
        throw new Error("Deal not found");
      }

      // Send deal activation notification
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e3a5f; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🎉 New Deal Activated</h1>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #1e3a5f;">Deal #${deal.deal_number}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Client:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${deal.client_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Phone:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${deal.client_phone}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Service:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${deal.service_type}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Total Amount:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">AED ${deal.total_amount?.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Paid:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; color: green;">AED ${deal.paid_amount?.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px;"><strong>Balance:</strong></td>
                <td style="padding: 8px; color: #e67e22; font-weight: bold;">AED ${(deal.balance_due || (deal.total_amount - deal.paid_amount))?.toLocaleString()}</td>
              </tr>
              ${deal.start_date ? `
              <tr>
                <td style="padding: 8px; border-top: 1px solid #ddd;"><strong>Start Date:</strong></td>
                <td style="padding: 8px; border-top: 1px solid #ddd;">${deal.start_date}</td>
              </tr>
              ` : ''}
              ${deal.end_date ? `
              <tr>
                <td style="padding: 8px;"><strong>End Date:</strong></td>
                <td style="padding: 8px;">${deal.end_date}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          <div style="padding: 15px; background: #1e3a5f; color: white; text-align: center; font-size: 12px;">
            TADMAIDS | +97143551186 | tadbeer@tadmaids.com
          </div>
        </div>
      `;

      const emailResponse = await resend.emails.send({
        from: "TADMAIDS <notifications@tadmaids.com>",
        to: NOTIFICATION_RECIPIENTS,
        subject: `✅ Deal Activated: ${deal.deal_number} - ${deal.client_name}`,
        html: emailHtml,
      });

      console.log("Deal activation email sent:", emailResponse);

      return new Response(JSON.stringify({ success: true, emailResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (type === "payment_reminder" || check_all_reminders) {
      // Find all deals with upcoming payment reminders
      const today = new Date();
      
      const { data: deals, error: dealsError } = await supabase
        .from("deals")
        .select("*")
        .gt("balance_due", 0)
        .not("end_date", "is", null)
        .in("status", ["Active", "Draft"]);

      if (dealsError) {
        console.error("Error fetching deals for reminders:", dealsError);
        throw new Error("Failed to fetch deals");
      }

      // Filter deals that are within their reminder window
      const dealsNeedingReminder = (deals || []).filter(deal => {
        if (!deal.end_date) return false;
        const endDate = new Date(deal.end_date);
        const daysUntilDue = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const reminderDays = deal.reminder_days_before || 3;
        
        // Include if within reminder window (e.g., 3 days for P4, 30 days for P5)
        return daysUntilDue > 0 && daysUntilDue <= reminderDays;
      });

      if (dealsNeedingReminder.length === 0) {
        console.log("No deals need payment reminders today");
        return new Response(JSON.stringify({ success: true, message: "No reminders needed" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Build reminder email
      const dealsHtml = dealsNeedingReminder.map(deal => {
        const endDate = new Date(deal.end_date);
        const daysUntilDue = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return `
          <tr style="background: ${daysUntilDue <= 3 ? '#fff3e0' : '#f9f9f9'};">
            <td style="padding: 10px; border: 1px solid #ddd;">${deal.deal_number}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${deal.client_name}<br><small>${deal.client_phone}</small></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${deal.service_type}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${deal.end_date}</td>
            <td style="padding: 10px; border: 1px solid #ddd; color: ${daysUntilDue <= 3 ? '#e74c3c' : '#e67e22'}; font-weight: bold;">
              ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}
            </td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: #e67e22;">
              AED ${(deal.balance_due || 0).toLocaleString()}
            </td>
          </tr>
        `;
      }).join('');

      const totalDue = dealsNeedingReminder.reduce((sum, d) => sum + (d.balance_due || 0), 0);

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <div style="background: #e67e22; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">⚠️ Payment Reminders</h1>
            <p style="margin: 5px 0 0 0;">${dealsNeedingReminder.length} deal(s) have payments due soon</p>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <table style="width: 100%; border-collapse: collapse; background: white;">
              <thead>
                <tr style="background: #1e3a5f; color: white;">
                  <th style="padding: 10px; text-align: left;">Deal #</th>
                  <th style="padding: 10px; text-align: left;">Client</th>
                  <th style="padding: 10px; text-align: left;">Service</th>
                  <th style="padding: 10px; text-align: left;">Due Date</th>
                  <th style="padding: 10px; text-align: left;">Days Left</th>
                  <th style="padding: 10px; text-align: right;">Balance</th>
                </tr>
              </thead>
              <tbody>
                ${dealsHtml}
              </tbody>
              <tfoot>
                <tr style="background: #1e3a5f; color: white;">
                  <td colspan="5" style="padding: 10px; font-weight: bold;">Total Outstanding</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold;">AED ${totalDue.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div style="padding: 15px; background: #1e3a5f; color: white; text-align: center; font-size: 12px;">
            TADMAIDS | +97143551186 | tadbeer@tadmaids.com
          </div>
        </div>
      `;

      const emailResponse = await resend.emails.send({
        from: "TADMAIDS <notifications@tadmaids.com>",
        to: NOTIFICATION_RECIPIENTS,
        subject: `⚠️ Payment Reminder: ${dealsNeedingReminder.length} deal(s) due soon - AED ${totalDue.toLocaleString()}`,
        html: emailHtml,
      });

      console.log("Payment reminder email sent:", emailResponse);

      return new Response(JSON.stringify({ 
        success: true, 
        deals_reminded: dealsNeedingReminder.length,
        total_amount: totalDue,
        emailResponse 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    throw new Error("Invalid notification type");

  } catch (error: any) {
    console.error("Error in send-deal-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);