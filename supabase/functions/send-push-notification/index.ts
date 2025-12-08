import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Only Rayaan for testing
const AUTHORIZED_DRIVER_IDS = [
  "e5ddce55-8111-45c0-b0a2-e1b752187516", // Rayaan
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Push notification function called");
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { title, message, userIds, url } = await req.json();
    console.log("Request payload:", { title, message, userIds, url });

    if (!title || !message) {
      console.log("Missing title or message");
      return new Response(
        JSON.stringify({ error: "Title and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter to only Rayaan for testing
    const targetUserIds = userIds 
      ? userIds.filter((id: string) => AUTHORIZED_DRIVER_IDS.includes(id))
      : AUTHORIZED_DRIVER_IDS;
    
    console.log("Target user IDs:", targetUserIds);

    // Get push subscriptions for target users
    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .in('user_id', targetUserIds);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions", details: error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Found subscriptions:", subscriptions?.length || 0);

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for target users');
      return new Response(
        JSON.stringify({ 
          success: true, 
          sent: 0, 
          message: "No subscriptions found. Users need to enable notifications first.",
          targetUserIds 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For each subscription, log what we would send
    for (const sub of subscriptions) {
      console.log("Would send to subscription:", sub.endpoint);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: 0,
        subscriptionsFound: subscriptions.length,
        message: "Subscriptions found but Web Push requires VAPID implementation"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in push notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});