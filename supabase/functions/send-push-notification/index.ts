import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("=== Push notification function called ===");
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { title, message, userIds, url, tag } = await req.json();
    console.log("Request payload:", { title, message, userIds, url, tag });

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: "Title and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create in-app notifications for all target users
    let notificationsCreated = 0;
    if (userIds && userIds.length > 0) {
      for (const userId of userIds) {
        const { error } = await supabaseAdmin.from('notifications').insert({
          user_id: userId,
          title,
          message,
          type: tag || 'task-assigned',
          is_read: false,
        });
        if (!error) notificationsCreated++;
        else console.error('Error creating notification:', error);
      }
      console.log('Created', notificationsCreated, 'in-app notifications');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        inAppCreated: notificationsCreated,
        message: `Created ${notificationsCreated} in-app notifications`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
