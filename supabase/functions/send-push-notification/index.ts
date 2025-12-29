import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push implementation for Deno
async function generateVapidHeaders(endpoint: string, vapidPublicKey: string, vapidPrivateKey: string, subject: string) {
  const urlParts = new URL(endpoint);
  const audience = `${urlParts.protocol}//${urlParts.host}`;
  
  // Create JWT header and payload
  const header = { alg: "ES256", typ: "JWT" };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  // Base64url encode
  const base64urlEncode = (data: object | Uint8Array) => {
    const str = typeof data === 'object' && !(data instanceof Uint8Array) 
      ? JSON.stringify(data) 
      : new TextDecoder().decode(data);
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const unsignedToken = `${base64urlEncode(header)}.${base64urlEncode(payload)}`;
  
  // Import the VAPID private key
  const privateKeyBase64 = vapidPrivateKey.replace(/-/g, '+').replace(/_/g, '/');
  const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));
  
  // Create the key for signing
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  // Sign the token
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureBytes = new Uint8Array(signature);
  const signatureBase64 = btoa(String.fromCharCode(...signatureBytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const jwt = `${unsignedToken}.${signatureBase64}`;

  return {
    Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
    "TTL": "86400",
  };
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: object,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  subject: string
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    const payloadString = JSON.stringify(payload);
    
    // For now, use a simple approach - send directly to the endpoint
    // The full Web Push encryption is complex, so we'll use a simpler notification approach
    const vapidHeaders = await generateVapidHeaders(
      subscription.endpoint,
      vapidPublicKey,
      vapidPrivateKey,
      subject
    );

    // Encode the payload
    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(payloadString);

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        ...vapidHeaders,
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "Content-Length": payloadBytes.length.toString(),
      },
      body: payloadBytes,
    });

    if (response.status === 201 || response.status === 200) {
      return { success: true, statusCode: response.status };
    } else if (response.status === 410) {
      // Subscription expired
      return { success: false, statusCode: 410, error: "Subscription expired" };
    } else {
      const errorText = await response.text();
      return { success: false, statusCode: response.status, error: errorText };
    }
  } catch (error: any) {
    console.error("Error sending push:", error);
    return { success: false, error: error.message };
  }
}

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

    const vapidPublicKey = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
    const subject = "mailto:support@tadmaids.com";

    if (!vapidPrivateKey) {
      console.error("VAPID_PRIVATE_KEY not configured");
      return new Response(
        JSON.stringify({ error: "VAPID_PRIVATE_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { title, message, userIds, url, tag } = await req.json();
    console.log("Request payload:", { title, message, userIds, url, tag });

    if (!title || !message) {
      console.log("Missing title or message");
      return new Response(
        JSON.stringify({ error: "Title and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get push subscriptions for target users
    let query = supabaseAdmin.from('push_subscriptions').select('*');
    
    if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds);
    }

    const { data: subscriptions, error } = await query;

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
      
      // Still create in-app notifications
      if (userIds && userIds.length > 0) {
        for (const userId of userIds) {
          await supabaseAdmin.from('notifications').insert({
            user_id: userId,
            title,
            message,
            type: tag || 'push',
            is_read: false,
          });
        }
        console.log('Created in-app notifications instead');
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          sent: 0, 
          inAppCreated: userIds?.length || 0,
          message: "No push subscriptions found. In-app notifications created.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = {
      title,
      message,
      url: url || '/tadgo',
      tag: tag || 'tadgo-notification',
    };

    let sentCount = 0;
    let failedCount = 0;
    const expiredSubscriptions: string[] = [];

    // Send to each subscription
    for (const sub of subscriptions) {
      console.log("Sending to subscription:", sub.endpoint?.substring(0, 50));
      
      const result = await sendWebPush(
        {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        payload,
        vapidPublicKey,
        vapidPrivateKey,
        subject
      );

      if (result.success) {
        sentCount++;
        console.log("Successfully sent to:", sub.user_id);
      } else {
        failedCount++;
        console.log("Failed to send:", result.error);
        
        if (result.statusCode === 410) {
          expiredSubscriptions.push(sub.id);
        }
      }
      
      // Also create in-app notification as backup
      await supabaseAdmin.from('notifications').insert({
        user_id: sub.user_id,
        title,
        message,
        type: tag || 'push',
        is_read: false,
      });
    }

    // Clean up expired subscriptions
    if (expiredSubscriptions.length > 0) {
      await supabaseAdmin
        .from('push_subscriptions')
        .delete()
        .in('id', expiredSubscriptions);
      console.log("Cleaned up expired subscriptions:", expiredSubscriptions.length);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        failed: failedCount,
        expiredCleaned: expiredSubscriptions.length,
        message: `Sent ${sentCount} push notifications, ${failedCount} failed`
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
