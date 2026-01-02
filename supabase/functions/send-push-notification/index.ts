import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as webpush from "jsr:@negrel/webpush@0.3.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VAPID_PUBLIC_KEY = "BFCssdHncTfTJ_E5iMpPEwKJoPN8FypY3dQKEMFZQ4DEv-0IeZ3bbHy2J5s4DS_12i-lAyWWLWi82XEXqAnDyYU";
const CONTACT = "mailto:notifications@tadmaids.com";

function decodeBase64UrlToBytes(base64url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function encodeBytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function getXYFromPublicKeyBase64Url(publicKeyB64Url: string): { x: string; y: string } {
  const raw = decodeBase64UrlToBytes(publicKeyB64Url);
  // Uncompressed P-256 public key: 0x04 || X(32) || Y(32)
  if (raw.length !== 65 || raw[0] !== 0x04) {
    throw new Error("Invalid VAPID public key format (expected 65-byte uncompressed EC point)");
  }
  const x = raw.slice(1, 33);
  const y = raw.slice(33, 65);
  return { x: encodeBytesToBase64Url(x), y: encodeBytesToBase64Url(y) };
}

function buildExportedVapidKeysFromEnv(): webpush.ExportedVapidKeys {
  const secret = Deno.env.get("VAPID_PRIVATE_KEY");
  if (!secret) throw new Error("VAPID_PRIVATE_KEY is not configured");

  // Compute x/y from the known public key used in the frontend subscribe() call.
  const { x, y } = getXYFromPublicKeyBase64Url(VAPID_PUBLIC_KEY);

  // Accept multiple formats:
  // 1) JSON with { publicKey: JsonWebKey, privateKey: JsonWebKey } (output of exportVapidKeys)
  // 2) JSON with a private JWK (must include `d`, may include x/y)
  // 3) Raw base64url `d` (private key) string
  try {
    const parsed = JSON.parse(secret);

    if (parsed?.publicKey && parsed?.privateKey) {
      return parsed as webpush.ExportedVapidKeys;
    }

    if (parsed?.d) {
      const privateKey: JsonWebKey = {
        kty: "EC",
        crv: "P-256",
        x: parsed.x || x,
        y: parsed.y || y,
        d: parsed.d,
        ext: true,
      };

      const publicKey: JsonWebKey = {
        kty: "EC",
        crv: "P-256",
        x: parsed.x || x,
        y: parsed.y || y,
        ext: true,
      };

      return { publicKey, privateKey };
    }
  } catch {
    // not JSON
  }

  // Fallback: secret is raw base64url `d`
  const d = secret.trim();
  const privateKey: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x,
    y,
    d,
    ext: true,
  };

  const publicKey: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x,
    y,
    ext: true,
  };

  return { publicKey, privateKey };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("=== send-push-notification called ===");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { title, message, userIds, url, tag } = await req.json();
    console.log("Request payload:", { title, hasMessage: !!message, userIdsCount: userIds?.length, url, tag });

    if (!title || !message) {
      return new Response(JSON.stringify({ error: "Title and message are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targets: string[] = Array.isArray(userIds) ? userIds.filter(Boolean) : [];
    if (targets.length === 0) {
      return new Response(JSON.stringify({ success: true, inAppCreated: 0, pushSent: 0, message: "No userIds provided" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build webpush application server
    const exportedVapidKeys = buildExportedVapidKeysFromEnv();
    const vapidKeys = await webpush.importVapidKeys(exportedVapidKeys, { extractable: false });
    const appServer = await webpush.ApplicationServer.new({
      contactInformation: CONTACT,
      vapidKeys,
    });

    let notificationsCreated = 0;
    let pushSent = 0;
    const payload = JSON.stringify({
      title,
      message,
      tag: tag || "notification",
      url: url || "/tadgo",
    });

    for (const userId of targets) {
      // 1) In-app notification
      const { error: insertError } = await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        title,
        message,
        type: tag || "notification",
        is_read: false,
      });

      if (!insertError) notificationsCreated++;
      else console.error("Error creating in-app notification:", insertError);

      // 2) Web push (if user has subscriptions)
      const { data: subscriptions, error: subError } = await supabaseAdmin
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", userId);

      if (subError) {
        console.error("Error fetching subscriptions:", subError);
        continue;
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`No push subscriptions found for user ${userId}`);
        continue;
      }

      console.log(`Found ${subscriptions.length} push subscriptions for user ${userId}`);

      for (const sub of subscriptions) {
        try {
          const subscriber = appServer.subscribe({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          });

          await subscriber.pushTextMessage(payload, {
            ttl: 86400,
            urgency: webpush.Urgency.High,
            topic: (tag || "notification").slice(0, 32),
          });

          pushSent++;
        } catch (e) {
          // If subscription is gone, remove it.
          if (e instanceof webpush.PushMessageError && e.isGone()) {
            console.log("Subscription is gone (410). Deleting:", sub.id);
            await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
            continue;
          }

          console.error("Push send error:", e?.toString?.() ?? e);
        }
      }
    }

    console.log("Created", notificationsCreated, "in-app notifications");
    console.log("Sent", pushSent, "push notifications");

    return new Response(
      JSON.stringify({
        success: true,
        inAppCreated: notificationsCreated,
        pushSent,
        message: `Created ${notificationsCreated} in-app notifications, sent ${pushSent} push notifications`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Error in send-push-notification:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
