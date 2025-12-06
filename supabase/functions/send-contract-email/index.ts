import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend("re_PchMak8p_Cf8gF3bankt4kaLpv2UsFsC2");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContractEmailRequest {
  to: string;
  clientName: string;
  dealNumber: string;
  totalAmount: number;
  dealSheetHtml: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, clientName, dealNumber, totalAmount, dealSheetHtml }: ContractEmailRequest = await req.json();

    if (!to) {
      return new Response(
        JSON.stringify({ error: "Client email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending contract email to ${to} for deal ${dealNumber}`);

    const emailResponse = await resend.emails.send({
      from: "TADMAIDS <tadbeer@tadmaids.com>",
      to: [to],
      subject: `Deal Sheet - ${dealNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Deal Sheet - ${dealNumber}</title>
          </head>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 800px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px;">
              <p style="margin-bottom: 20px;">Dear ${clientName},</p>
              
              <p>Please find below your deal sheet for reference.</p>
              
              <!-- Deal Sheet Content -->
              ${dealSheetHtml}
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
              
              <p>For any queries, please contact us at:</p>
              <p style="margin: 5px 0;">Phone: +97143551186</p>
              <p style="margin: 5px 0;">Email: tadbeer@tadmaids.com</p>
              
              <p style="margin-top: 30px;">Best regards,<br/><strong>TADMAIDS Team</strong></p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-contract-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
