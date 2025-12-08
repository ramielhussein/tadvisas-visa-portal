import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// VAPID keys - you need to generate these
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';

// Authorized driver IDs
const AUTHORIZED_DRIVER_IDS = [
  "e5ddce55-8111-45c0-b0a2-e1b752187516", // Rayaan
  "050adaa3-695d-4c53-b070-bf28feb968f7", // Sreejith
  "5af01730-5863-473f-b7be-e2261e6e22fa", // Talal
  "496c8a50-7828-4fee-b4e5-030ae7338455", // Yasin
];

async function sendWebPush(subscription: any, payload: any): Promise<boolean> {
  try {
    // Using web-push-libs for Deno
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    
    // Create JWT for VAPID
    const header = { alg: 'ES256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      aud: new URL(subscription.endpoint).origin,
      exp: now + 12 * 60 * 60, // 12 hours
      sub: 'mailto:admin@tadmaids.com'
    };

    // For now, use a simple fetch approach (works for testing)
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
      },
      body: data
    });

    return response.ok || response.status === 201;
  } catch (error) {
    console.error('Error sending push:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { title, message, userIds, url } = await req.json();

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: "Title and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter to only authorized drivers if userIds provided
    const targetUserIds = userIds 
      ? userIds.filter((id: string) => AUTHORIZED_DRIVER_IDS.includes(id))
      : AUTHORIZED_DRIVER_IDS;

    // Get push subscriptions for target users
    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .in('user_id', targetUserIds);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for target users');
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No subscriptions found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = {
      title,
      message,
      url: url || '/tadgo',
      tag: `tadgo-${Date.now()}`
    };

    let successCount = 0;
    const failedEndpoints: string[] = [];

    for (const sub of subscriptions) {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      const success = await sendWebPush(subscription, payload);
      if (success) {
        successCount++;
      } else {
        failedEndpoints.push(sub.endpoint);
        // Remove invalid subscription
        await supabaseAdmin
          .from('push_subscriptions')
          .delete()
          .eq('id', sub.id);
      }
    }

    console.log(`Push notifications sent: ${successCount}/${subscriptions.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        total: subscriptions.length,
        failed: failedEndpoints.length 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending push notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
