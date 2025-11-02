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

    // 2) Null out other foreign key references to auth.users(id)
    // Some tables may not have ON DELETE SET NULL configured
    const cleanupRefs: Array<{ table: string; column: string }> = [
      { table: "deals", column: "assigned_to" },
      { table: "transactions", column: "created_by" },
      { table: "workers", column: "created_by" },
      { table: "refunds", column: "approved_by" },
      { table: "payments", column: "recorded_by" },
    ];

    // Run updates sequentially to capture first failure clearly
    for (const ref of cleanupRefs) {
      const { error } = await supabaseAdmin
        .from(ref.table)
        .update({ [ref.column]: null as any })
        .eq(ref.column, targetUserId);

      if (error) {
        console.error(`Error cleaning reference ${ref.table}.${ref.column}:`, error);
        return new Response(
          JSON.stringify({
            error: `Failed to clean ${ref.table}.${ref.column} references before deletion`,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

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
