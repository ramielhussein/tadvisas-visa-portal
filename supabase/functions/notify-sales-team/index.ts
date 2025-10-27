import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  leadId: string;
  phoneNumber: string;
  existingLeadData?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { leadId, phoneNumber, existingLeadData }: NotifyRequest = await req.json();

    console.log("Notifying sales team about lead:", leadId, phoneNumber);

    // Determine who to notify
    let usersToNotify: string[] = [];

    if (existingLeadData?.assigned_to) {
      // Lead is assigned, notify only the assigned person
      usersToNotify = [existingLeadData.assigned_to];
      console.log("Lead is assigned to:", existingLeadData.assigned_to);
    } else {
      // Lead is not assigned, notify all sales team members (users with roles)
      const { data: salesTeam, error: teamError } = await supabase
        .from("user_roles")
        .select("user_id");

      if (teamError) {
        console.error("Error fetching sales team:", teamError);
        throw teamError;
      }

      usersToNotify = salesTeam?.map((member) => member.user_id) || [];
      console.log("Notifying all sales team members:", usersToNotify.length);
    }

    if (usersToNotify.length === 0) {
      console.log("No users to notify");
      return new Response(
        JSON.stringify({ message: "No users to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notifications for each user
    const notifications = usersToNotify.map((userId) => ({
      user_id: userId,
      title: "Duplicate Lead Alert",
      message: `Phone number ${phoneNumber} already exists in the system${
        existingLeadData?.client_name ? ` for ${existingLeadData.client_name}` : ""
      }. Someone is trying to add this lead again.`,
      type: "warning",
      related_lead_id: leadId,
      is_read: false,
    }));

    const { data, error } = await supabase
      .from("notifications")
      .insert(notifications)
      .select();

    if (error) {
      console.error("Error creating notifications:", error);
      throw error;
    }

    console.log("Notifications created successfully:", data?.length);

    return new Response(
      JSON.stringify({
        success: true,
        notificationsCreated: data?.length || 0,
        usersNotified: usersToNotify,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-sales-team function:", error);
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
