import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHash } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PIXEL_ID = "1197276245426225";
const API_VERSION = "v18.0";

// SHA256 hash function for user data
async function sha256Hash(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const META_ACCESS_TOKEN = Deno.env.get('META_ACCESS_TOKEN');
    if (!META_ACCESS_TOKEN) {
      throw new Error('META_ACCESS_TOKEN is not configured');
    }

    const body = await req.json();
    const { 
      event_name, 
      event_id, 
      event_source_url, 
      user_data,
      custom_data 
    } = body;

    console.log(`Processing Meta CAPI event: ${event_name}`, { event_id });

    // Build user_data with hashing
    // Extract only the first IP from x-forwarded-for (client's real IP)
    const forwardedFor = req.headers.get('x-forwarded-for') || '';
    const clientIp = forwardedFor.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip') || '';
    
    const hashedUserData: Record<string, any> = {
      client_ip_address: clientIp,
      client_user_agent: req.headers.get('user-agent') || '',
    };

    // Hash email if provided
    if (user_data?.email) {
      hashedUserData.em = [await sha256Hash(user_data.email)];
    }

    // Hash phone if provided (normalize to digits only)
    if (user_data?.phone) {
      const normalizedPhone = user_data.phone.replace(/\D/g, '');
      hashedUserData.ph = [await sha256Hash(normalizedPhone)];
    }

    // Hash first name if provided
    if (user_data?.first_name) {
      hashedUserData.fn = [await sha256Hash(user_data.first_name)];
    }

    // Hash last name if provided
    if (user_data?.last_name) {
      hashedUserData.ln = [await sha256Hash(user_data.last_name)];
    }

    // Add country (UAE)
    hashedUserData.country = [await sha256Hash('ae')];

    // External ID (fbp/fbc cookies if available)
    if (user_data?.fbp) {
      hashedUserData.fbp = user_data.fbp;
    }
    if (user_data?.fbc) {
      hashedUserData.fbc = user_data.fbc;
    }

    // Build the event payload
    const eventPayload = {
      data: [{
        event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_id, // For deduplication with browser Pixel
        event_source_url,
        action_source: 'website',
        user_data: hashedUserData,
        custom_data: custom_data || {},
      }],
    };

    console.log('Sending to Meta CAPI:', JSON.stringify(eventPayload, null, 2));

    // Send to Meta Conversions API
    const metaResponse = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      }
    );

    const metaResult = await metaResponse.json();
    console.log('Meta CAPI response:', metaResult);

    if (!metaResponse.ok) {
      throw new Error(`Meta CAPI error: ${JSON.stringify(metaResult)}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        events_received: metaResult.events_received,
        event_id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Meta CAPI error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
