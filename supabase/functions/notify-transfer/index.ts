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
  gmapLink?: string;
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

    const { transferId, eventType, driverId, transferNumber, pickupLocation, dropoffLocation, gmapLink }: TransferNotifyRequest = await req.json();
    console.log("Request payload:", { transferId, eventType, driverId, transferNumber, gmapLink });

    if (!transferId || !eventType) {
      return new Response(
        JSON.stringify({ error: "transferId and eventType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get transfer details if not provided
    let transfer = { 
      transfer_number: transferNumber, 
      pickup_location: pickupLocation, 
      dropoff_location: dropoffLocation, 
      driver_id: driverId,
      gmap_link: gmapLink 
    };
    
    if (!transferNumber || !pickupLocation) {
      const { data: transferData, error: transferError } = await supabaseAdmin
        .from('worker_transfers')
        .select('transfer_number, pickup_location, dropoff_location, driver_id, gmap_link, from_location, to_location')
        .eq('id', transferId)
        .single();
      
      if (transferError) {
        console.error('Error fetching transfer:', transferError);
      } else {
        transfer = {
          ...transferData,
          pickup_location: transferData.from_location || transferData.pickup_location,
          dropoff_location: transferData.to_location || transferData.dropoff_location,
        };
      }
    }

    const notifications: { userId: string; title: string; message: string; tag: string }[] = [];
    const gmapText = transfer.gmap_link ? ` 📍 Map: ${transfer.gmap_link}` : '';
    const taskMessage = `${transfer.transfer_number || transferId.substring(0, 8)}: ${transfer.pickup_location || 'Unknown'} → ${transfer.dropoff_location || 'Unknown'}${gmapText}`;

    // Handle different event types
    if (eventType === 'created') {
      const assignedDriverId = driverId || transfer.driver_id;
      
      if (assignedDriverId) {
        // Transfer is assigned to a specific driver - notify only that driver
        notifications.push({
          userId: assignedDriverId,
          title: '📋 New Task Assigned',
          message: `You have a new task: ${taskMessage}`,
          tag: 'task-assigned',
        });
        console.log(`Transfer assigned to driver: ${assignedDriverId}`);

        // Also notify managers about the assignment
        const { data: managers, error: managersError } = await supabaseAdmin
          .from('user_roles')
          .select('user_id')
          .eq('role', 'driver_manager');

        if (!managersError && managers && managers.length > 0) {
          for (const manager of managers) {
            notifications.push({
              userId: manager.user_id,
              title: '🚗 New Transfer Assigned',
              message: `New task created and assigned: ${taskMessage}`,
              tag: 'transfer-created',
            });
          }
          console.log(`Will also notify ${managers.length} managers`);
        }
      } else {
        // Transfer is NOT assigned - notify ALL drivers
        const { data: drivers, error: driversError } = await supabaseAdmin
          .from('user_roles')
          .select('user_id')
          .eq('role', 'driver');

        if (driversError) {
          console.error('Error fetching drivers:', driversError);
        } else if (drivers && drivers.length > 0) {
          for (const driver of drivers) {
            notifications.push({
              userId: driver.user_id,
              title: '🚗 New Task Available',
              message: `New unassigned task: ${taskMessage}`,
              tag: 'task-available',
            });
          }
          console.log(`Will notify ${drivers.length} drivers about unassigned task`);
        }

        // Also notify managers
        const { data: managers, error: managersError } = await supabaseAdmin
          .from('user_roles')
          .select('user_id')
          .eq('role', 'driver_manager');

        if (!managersError && managers && managers.length > 0) {
          for (const manager of managers) {
            notifications.push({
              userId: manager.user_id,
              title: '🚗 New Unassigned Transfer',
              message: `New unassigned task needs a driver: ${taskMessage}`,
              tag: 'transfer-created',
            });
          }
          console.log(`Will also notify ${managers.length} managers`);
        }
      }
    }

    if (eventType === 'assigned' && (driverId || transfer.driver_id)) {
      // Notify the assigned driver when assignment happens later
      const targetDriverId = driverId || transfer.driver_id;
      notifications.push({
        userId: targetDriverId,
        title: '📋 New Task Assigned',
        message: `You have been assigned a task: ${taskMessage}`,
        tag: 'task-assigned',
      });
      console.log(`Will notify driver about assignment: ${targetDriverId}`);
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
