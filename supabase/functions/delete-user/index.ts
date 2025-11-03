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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user has admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden - Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the user ID to delete from the request
    const { userId, email } = await req.json();

    if (!userId && !email) {
      return new Response(JSON.stringify({ error: "userId or email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If email provided, get the user ID
    let targetUserId = userId;
    if (email && !userId) {
      const { data: userData } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();
      
      if (userData) {
        targetUserId = userData.id;
      }
    }

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent admin from deleting themselves
    if (targetUserId === user.id) {
      return new Response(JSON.stringify({ error: "Cannot delete your own account" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Before deleting, clean up all references to this user to avoid FK violations
    // 1) Unassign all leads
    const { error: unassignLeadsError } = await supabaseAdmin
      .from("leads")
      .update({ assigned_to: null })
      .eq("assigned_to", targetUserId);

    if (unassignLeadsError) {
      console.error("Error unassigning leads:", unassignLeadsError);
      return new Response(
        JSON.stringify({ error: "Failed to unassign leads before deletion" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2) Clean up other references to this user
    // Reassign non-nullable foreign keys to the requesting admin, and null/delete where appropriate
    const adminUserId = user.id;

    // Helpers to avoid failing the whole request on a single table error
    async function safeUpdate(table: string, values: Record<string, any>, filter: { column: string; value: string }) {
      const { error } = await supabaseAdmin.from(table).update(values).eq(filter.column, filter.value);
      if (error) {
        console.error(`Error updating ${table}.${filter.column}:`, error);
      }
    }

    async function safeDelete(table: string, filter: { column: string; value: string }) {
      const { error } = await supabaseAdmin.from(table).delete().eq(filter.column, filter.value);
      if (error) {
        console.error(`Error deleting from ${table} where ${filter.column} = ${filter.value}:`, error);
      }
    }

    // Nullable references -> set to null
    await safeUpdate("deals", { assigned_to: null as any }, { column: "assigned_to", value: targetUserId });
    await safeUpdate("payments", { recorded_by: null as any }, { column: "recorded_by", value: targetUserId });
    await safeUpdate("refunds", { approved_by: null as any }, { column: "approved_by", value: targetUserId });
    await safeUpdate("refunds", { prepared_by: null as any }, { column: "prepared_by", value: targetUserId });
    await safeUpdate("refunds", { finalized_by: null as any }, { column: "finalized_by", value: targetUserId });
    await safeUpdate("contracts", { created_by: null as any }, { column: "created_by", value: targetUserId });

    // Non-nullable references -> reassign to admin
    await safeUpdate("purchase_orders", { created_by: adminUserId }, { column: "created_by", value: targetUserId });
    await safeUpdate("delivery_orders", { delivered_by: adminUserId }, { column: "delivered_by", value: targetUserId });
    await safeUpdate("receipt_orders", { received_by: adminUserId }, { column: "received_by", value: targetUserId });
    await safeUpdate("daily_headcount", { counted_by: adminUserId }, { column: "counted_by", value: targetUserId });
    await safeUpdate("nationality_workflows", { created_by: adminUserId }, { column: "created_by", value: targetUserId });
    await safeUpdate("contracts", { salesman_id: adminUserId }, { column: "salesman_id", value: targetUserId });
    await safeUpdate("sales_targets", { created_by: adminUserId }, { column: "created_by", value: targetUserId });

    // Rows tightly coupled to the user identity -> delete
    await safeDelete("sales_targets", { column: "user_id", value: targetUserId });
    await safeDelete("lead_activities", { column: "user_id", value: targetUserId });
    await safeDelete("notifications", { column: "user_id", value: targetUserId });

    // Clean profile and role rows if they exist
    await safeDelete("profiles", { column: "id", value: targetUserId });
    await safeDelete("user_roles", { column: "user_id", value: targetUserId });

    // Delete the user using admin client
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      throw deleteError;
    }

    console.log("User deleted successfully:", targetUserId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "User deleted successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in delete-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to delete user" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
