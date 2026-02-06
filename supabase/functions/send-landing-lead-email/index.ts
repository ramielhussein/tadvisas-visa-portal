import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadSubmission {
  name: string;
  phone: string;
  email?: string;
  nationality?: string;
  serviceType?: string;    // P4 - Hire a Maid
  visaStatus?: string;     // P3 - Maid Visa
  message?: string;
  leadSource: string;
  utmParams?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    gclid?: string;
    fbclid?: string;
  };
}

// Detect which landing page the lead came from
const getPageContext = (data: LeadSubmission) => {
  const source = (data.leadSource || '').toLowerCase();
  const isP4 = source.includes('p4') || source.includes('hire a maid') || !!data.serviceType;
  
  return {
    isP4,
    label: isP4 ? 'Hire a Maid (P4)' : 'Maid Visa (P3)',
    emoji: isP4 ? '🏠' : '📋',
    headerColor: isP4 ? '#065f46' : '#1e3a5f',       // green for P4, blue for P3
    headerGradient: isP4 
      ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)' 
      : 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
    subjectPrefix: isP4 ? '🏠 P4 Hire a Maid Lead' : '📋 P3 Maid Visa Lead',
  };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: LeadSubmission = await req.json();
    const ctx = getPageContext(data);
    
    console.log(`Received ${ctx.label} submission:`, {
      name: data.name,
      phone: data.phone,
      leadSource: data.leadSource,
    });

    // Build service-specific row
    const serviceRow = data.serviceType 
      ? `<div style="display: flex; align-items: center;">
           <span style="width: 24px; text-align: center;">🛠️</span>
           <strong style="min-width: 120px; color: #6b7280;">Service Type:</strong>
           <span style="background: #ecfdf5; color: #065f46; padding: 2px 8px; border-radius: 4px; font-size: 13px; font-weight: 600;">${data.serviceType}</span>
         </div>`
      : '';

    const visaRow = data.visaStatus 
      ? `<div style="display: flex; align-items: center;">
           <span style="width: 24px; text-align: center;">📋</span>
           <strong style="min-width: 120px; color: #6b7280;">Visa Status:</strong>
           <span style="color: #1f2937;">${data.visaStatus}</span>
         </div>`
      : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
          <!-- Header with page-specific color -->
          <div style="background: ${ctx.headerGradient}; color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0 0 8px 0; font-size: 24px;">${ctx.emoji} New ${ctx.label} Lead!</h1>
            <p style="margin: 0; opacity: 0.9; font-size: 14px;">Landing Page Submission • ${data.leadSource || 'Direct'}</p>
          </div>
          
          <div style="background: #ffffff; padding: 24px; border-radius: 0 0 8px 8px;">
            <!-- Page Identifier Badge -->
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="background: ${ctx.isP4 ? '#ecfdf5' : '#dbeafe'}; color: ${ctx.isP4 ? '#065f46' : '#1e40af'}; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">
                ${ctx.label.toUpperCase()} LANDING PAGE
              </span>
            </div>

            <!-- Lead Details -->
            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">
                Lead Details
              </h2>
              
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; align-items: center;">
                  <span style="width: 24px; text-align: center;">👤</span>
                  <strong style="min-width: 120px; color: #6b7280;">Name:</strong>
                  <span style="color: #1f2937; font-weight: 600;">${data.name || "Not provided"}</span>
                </div>
                
                <div style="display: flex; align-items: center;">
                  <span style="width: 24px; text-align: center;">📱</span>
                  <strong style="min-width: 120px; color: #6b7280;">Phone:</strong>
                  <a href="tel:${data.phone}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${data.phone}</a>
                </div>
                
                ${data.email ? `
                  <div style="display: flex; align-items: center;">
                    <span style="width: 24px; text-align: center;">✉️</span>
                    <strong style="min-width: 120px; color: #6b7280;">Email:</strong>
                    <a href="mailto:${data.email}" style="color: #2563eb; text-decoration: none;">${data.email}</a>
                  </div>
                ` : ""}
                
                ${data.nationality ? `
                  <div style="display: flex; align-items: center;">
                    <span style="width: 24px; text-align: center;">🌍</span>
                    <strong style="min-width: 120px; color: #6b7280;">Nationality:</strong>
                    <span style="color: #1f2937;">${data.nationality}</span>
                  </div>
                ` : ""}
                
                ${serviceRow}
                ${visaRow}
                
                <div style="display: flex; align-items: center;">
                  <span style="width: 24px; text-align: center;">📣</span>
                  <strong style="min-width: 120px; color: #6b7280;">Lead Source:</strong>
                  <span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 13px; font-weight: 600;">${data.leadSource || 'Direct'}</span>
                </div>
              </div>
            </div>
            
            ${data.message ? `
              <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <strong style="color: #92400e; display: block; margin-bottom: 8px;">📝 Message:</strong>
                <p style="margin: 0; color: #78350f; white-space: pre-wrap;">${data.message}</p>
              </div>
            ` : ""}
            
            ${data.utmParams && (data.utmParams.utm_source || data.utmParams.gclid || data.utmParams.fbclid) ? `
              <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <strong style="color: #166534; display: block; margin-bottom: 8px;">📊 Ad Attribution:</strong>
                <div style="font-size: 13px; color: #15803d;">
                  ${data.utmParams.utm_source ? `<div><strong>Source:</strong> ${data.utmParams.utm_source}</div>` : ""}
                  ${data.utmParams.utm_medium ? `<div><strong>Medium:</strong> ${data.utmParams.utm_medium}</div>` : ""}
                  ${data.utmParams.utm_campaign ? `<div><strong>Campaign:</strong> ${data.utmParams.utm_campaign}</div>` : ""}
                  ${data.utmParams.utm_content ? `<div><strong>Content:</strong> ${data.utmParams.utm_content}</div>` : ""}
                  ${data.utmParams.utm_term ? `<div><strong>Term:</strong> ${data.utmParams.utm_term}</div>` : ""}
                  ${data.utmParams.gclid ? `<div><strong>Google Click ID:</strong> ${data.utmParams.gclid}</div>` : ""}
                  ${data.utmParams.fbclid ? `<div><strong>Meta Click ID:</strong> ${data.utmParams.fbclid}</div>` : ""}
                </div>
              </div>
            ` : ""}
            
            <!-- Quick Action Buttons -->
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Quick Actions</p>
              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 13px;">
                <a href="https://wa.me/${data.phone.replace(/[^0-9]/g, "")}" style="color: #22c55e; text-decoration: none; font-weight: 600;">💬 WhatsApp</a>
                &nbsp;&nbsp;•&nbsp;&nbsp;
                <a href="tel:${data.phone}" style="color: #2563eb; text-decoration: none; font-weight: 600;">📞 Call Now</a>
                ${data.email ? `&nbsp;&nbsp;•&nbsp;&nbsp;<a href="mailto:${data.email}" style="color: #7c3aed; text-decoration: none; font-weight: 600;">✉️ Email</a>` : ''}
              </p>
            </div>
          </div>
          
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
            TADMAIDS • ${ctx.label} Landing Page • ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </body>
      </html>
    `;

    // Send email with page-specific subject line
    const { error: emailError } = await resend.emails.send({
      from: "TAD Maids Leads <leads@tadvisas.com>",
      to: ["tadmaidsdrive@gmail.com"],
      subject: `${ctx.subjectPrefix}: ${data.name || data.phone}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      throw emailError;
    }

    console.log(`${ctx.label} lead email sent successfully`);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-landing-lead-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
