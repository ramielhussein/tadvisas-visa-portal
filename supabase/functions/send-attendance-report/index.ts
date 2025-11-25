import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AttendanceRecord {
  employee_id: string;
  full_name: string;
  position: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  total_break_minutes: number;
  net_working_hours: number | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`Fetching attendance records for ${today}`);

    // Fetch today's attendance records with employee details
    const { data: attendanceData, error: attendanceError } = await supabase
      .from("attendance_records")
      .select(`
        employee_id,
        check_in_time,
        check_out_time,
        status,
        total_break_minutes,
        net_working_hours,
        employees (
          full_name,
          position
        )
      `)
      .eq("attendance_date", today)
      .order("check_in_time", { ascending: true });

    if (attendanceError) {
      console.error("Error fetching attendance:", attendanceError);
      throw attendanceError;
    }

    // Format the data
    const records: AttendanceRecord[] = (attendanceData || []).map((record: any) => ({
      employee_id: record.employee_id,
      full_name: record.employees?.full_name || "Unknown",
      position: record.employees?.position || "N/A",
      check_in_time: record.check_in_time,
      check_out_time: record.check_out_time,
      status: record.status,
      total_break_minutes: record.total_break_minutes,
      net_working_hours: record.net_working_hours,
    }));

    // Calculate summary stats
    const workingCount = records.filter(r => r.status === "checked_in").length;
    const onBreakCount = records.filter(r => r.status === "on_break").length;
    const checkedOutCount = records.filter(r => r.status === "checked_out").length;
    const totalStaff = records.length;

    // Generate HTML email
    const emailHTML = generateEmailHTML(today, records, {
      workingCount,
      onBreakCount,
      checkedOutCount,
      totalStaff,
    });

    // Send email to HR team
    const recipients = ["nour@tadmaids.com", "joseph@tadmaids.com", "rami@tadmaids.com"];
    
    const emailResponse = await resend.emails.send({
      from: "Tadmaids HR <onboarding@resend.dev>",
      to: recipients,
      subject: `Daily Attendance Report - ${today}`,
      html: emailHTML,
    });

    console.log("Attendance report sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        recordCount: totalStaff,
        sentTo: recipients 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-attendance-report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateEmailHTML(
  date: string,
  records: AttendanceRecord[],
  summary: { workingCount: number; onBreakCount: number; checkedOutCount: number; totalStaff: number }
): string {
  const formatTime = (time: string | null) => {
    if (!time) return "-";
    return new Date(time).toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: true 
    });
  };

  const formatHours = (hours: number | null) => {
    if (hours === null) return "-";
    return `${hours.toFixed(2)}h`;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      checked_in: '<span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Working</span>',
      on_break: '<span style="background: #f59e0b; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">On Break</span>',
      checked_out: '<span style="background: #6b7280; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Checked Out</span>',
    };
    return badges[status] || status;
  };

  const rowsHTML = records.map(record => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; text-align: left;">${record.full_name}</td>
      <td style="padding: 12px; text-align: left;">${record.position}</td>
      <td style="padding: 12px; text-align: center;">${formatTime(record.check_in_time)}</td>
      <td style="padding: 12px; text-align: center;">${formatTime(record.check_out_time)}</td>
      <td style="padding: 12px; text-align: center;">${record.total_break_minutes} min</td>
      <td style="padding: 12px; text-align: center;">${formatHours(record.net_working_hours)}</td>
      <td style="padding: 12px; text-align: center;">${getStatusBadge(record.status)}</td>
    </tr>
  `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Daily Attendance Report</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; color: white;">
        <h1 style="margin: 0; font-size: 28px;">Daily Attendance Report</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${date}</p>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #374151;">Summary</h2>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
          <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="font-size: 24px; font-weight: bold; color: #10b981;">${summary.workingCount}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Working Now</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${summary.onBreakCount}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">On Break</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="font-size: 24px; font-weight: bold; color: #6b7280;">${summary.checkedOutCount}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Checked Out</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${summary.totalStaff}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Total Staff</div>
          </div>
        </div>
      </div>

      <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #374151;">Attendance Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Staff Name</th>
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Position</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Check In</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Check Out</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Break Time</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Net Hours</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 8px; text-align: center; color: #6b7280; font-size: 12px;">
        <p style="margin: 0;">This is an automated report from Tadmaids HR System</p>
        <p style="margin: 5px 0 0 0;">Generated on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
}

serve(handler);
