import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TransferNotifyRequest {
  transferId: string;
  eventType: 'created' | 'assigned' | 'updated';
  driverId?: string;
  transferNumber?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Transfer notification function called");
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { transferId, eventType, driverId, transferNumber, pickupLocation, dropoffLocation }: TransferNotifyRequest = await req.json();
    console.log("Request payload:", { transferId, eventType, driverId, transferNumber });

    if (!transferId || !eventType) {
      return new Response(
        JSON.stringify({ error: "transferId and eventType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get transfer details if not provided
    let transfer = { transfer_number: transferNumber, pickup_location: pickupLocation, dropoff_location: dropoffLocation, driver_id: driverId };
    
    if (!transferNumber || !pickupLocation) {
      const { data: transferData, error: transferError } = await supabaseAdmin
        .from('worker_transfers')
        .select('transfer_number, pickup_location, dropoff_location, driver_id')
        .eq('id', transferId)
        .single();
      
      if (transferError) {
        console.error('Error fetching transfer:', transferError);
      } else {
        transfer = transferData;
      }
    }

    const notifications: { userId: string; title: string; message: string; tag: string }[] = [];

    // Handle different event types
    if (eventType === 'created') {
      // Notify all driver managers when a transfer is created
      const { data: managers, error: managersError } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'driver_manager');

      if (managersError) {
        console.error('Error fetching managers:', managersError);
      } else if (managers && managers.length > 0) {
        for (const manager of managers) {
          notifications.push({
            userId: manager.user_id,
            title: '🚗 New Transfer Created',
            message: `Transfer ${transfer.transfer_number || transferId.substring(0, 8)} from ${transfer.pickup_location || 'Unknown'} to ${transfer.dropoff_location || 'Unknown'}`,
            tag: 'transfer-created',
          });
        }
        console.log(`Will notify ${managers.length} managers`);
      }
    }

    if (eventType === 'assigned' && (driverId || transfer.driver_id)) {
      // Notify the assigned driver
      const targetDriverId = driverId || transfer.driver_id;
      notifications.push({
        userId: targetDriverId,
        title: '📋 New Task Assigned',
        message: `You have a new task: ${transfer.transfer_number || transferId.substring(0, 8)}. Pickup: ${transfer.pickup_location || 'Check app for details'}`,
        tag: 'task-assigned',
      });
      console.log(`Will notify driver: ${targetDriverId}`);
    }

    // Send push notifications
    let sentCount = 0;
    for (const notif of notifications) {
      try {
        // Call the send-push-notification function
        const response = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push-notification`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              title: notif.title,
              message: notif.message,
              userIds: [notif.userId],
              url: '/tadgo',
              tag: notif.tag,
            }),
          }
        );

        if (response.ok) {
          sentCount++;
          console.log(`Notification sent to ${notif.userId}`);
        } else {
          const errorText = await response.text();
          console.error(`Failed to send notification to ${notif.userId}:`, errorText);
        }
      } catch (error) {
        console.error(`Error sending notification to ${notif.userId}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: sentCount,
        totalTargets: notifications.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in transfer notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
