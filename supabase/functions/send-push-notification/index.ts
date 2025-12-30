import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push encryption utilities
function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(base64 + padding);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateJWT(vapidPrivateKey: string, audience: string): Promise<string> {
  const header = { alg: 'ES256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 86400, // 24 hours
    sub: 'mailto:notifications@tadmaids.com'
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import the private key
  const privateKeyBytes = base64UrlDecode(vapidPrivateKey);
  
  // Create the proper key format for ECDSA P-256
  const keyData = new Uint8Array(privateKeyBytes.length + 2);
  keyData[0] = 0x04; // Uncompressed point indicator (though this is for public keys)
  
  // For private key, we need to create a proper JWK
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: vapidPrivateKey,
    x: 'UKyx2dyxcsQsTgtRcKu0-j7PmPssPZxfMCBh_NnxwN8', // Placeholder, will derive
    y: 'KJ3ETfMzm0pS2T1fNiHKPXd-HB9z4ks2Mz4cQvuHnWE'  // Placeholder, will derive
  };

  try {
    const key = await crypto.subtle.importKey(
      'jwk',
      {
        kty: 'EC',
        crv: 'P-256',
        d: vapidPrivateKey,
        x: 'UKyx2dyx0cE_DEL8oqE3yd59scHYdlKG_nJg4P5kk2w',
        y: 'NJiVlrxMw8_CJoAZd2gyJTElTU6dEIz_JtEJEoKoJbw'
      },
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      new TextEncoder().encode(unsignedToken)
    );

    return `${unsignedToken}.${base64UrlEncode(signature)}`;
  } catch (e) {
    console.error('JWT generation failed:', e);
    throw e;
  }
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    
    // For now, use a simpler approach without encryption
    // Just send the notification request with VAPID headers
    const jwt = await generateJWT(vapidPrivateKey, audience);
    
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
      },
      body: new TextEncoder().encode(payload)
    });

    if (response.ok || response.status === 201) {
      console.log('Push sent successfully to:', subscription.endpoint.substring(0, 50));
      return true;
    } else {
      console.error('Push failed:', response.status, await response.text());
      return false;
    }
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
    console.log("=== Push notification function called ===");
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const vapidPublicKey = 'BFCssdHncTfTJ_E5iMpPEwKJoPN8FypY3dQKEMFZQ4DEv-0IeZ3bbHy2J5s4DS_12i-lAyWWLWi82XEXqAnDyYU';
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

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
    let pushSent = 0;
    
    if (userIds && userIds.length > 0) {
      for (const userId of userIds) {
        // Create in-app notification
        const { error } = await supabaseAdmin.from('notifications').insert({
          user_id: userId,
          title,
          message,
          type: tag || 'task-assigned',
          is_read: false,
        });
        if (!error) notificationsCreated++;
        else console.error('Error creating notification:', error);

        // Try to send push notification if VAPID key is configured
        if (vapidPrivateKey) {
          // Get push subscriptions for this user
          const { data: subscriptions, error: subError } = await supabaseAdmin
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', userId);

          if (subError) {
            console.error('Error fetching subscriptions:', subError);
          } else if (subscriptions && subscriptions.length > 0) {
            console.log(`Found ${subscriptions.length} push subscriptions for user ${userId}`);
            
            const payload = JSON.stringify({
              title,
              body: message,
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              tag: tag || 'notification',
              data: { url: url || '/tadgo' }
            });

            for (const sub of subscriptions) {
              try {
                const success = await sendWebPush(
                  { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
                  payload,
                  vapidPublicKey,
                  vapidPrivateKey
                );
                if (success) pushSent++;
              } catch (e) {
                console.error('Push send error:', e);
              }
            }
          } else {
            console.log(`No push subscriptions found for user ${userId}`);
          }
        } else {
          console.log('VAPID_PRIVATE_KEY not configured, skipping push');
        }
      }
      console.log('Created', notificationsCreated, 'in-app notifications');
      console.log('Sent', pushSent, 'push notifications');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        inAppCreated: notificationsCreated,
        pushSent: pushSent,
        message: `Created ${notificationsCreated} in-app notifications, sent ${pushSent} push notifications`
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
