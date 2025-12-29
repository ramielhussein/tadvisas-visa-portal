import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { placeId } = await req.json();
    
    if (!placeId) {
      throw new Error('place_id is required');
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      throw new Error('Google Places API key not configured');
    }

    console.log(`Getting details for place: ${placeId}`);

    // Use Places API (New) - Place Details
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Places API error:', response.status, errorText);
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Got details for: ${data.displayName?.text}`);

    // Transform to simpler format
    const result = {
      place_id: data.id,
      name: data.displayName?.text,
      formatted_address: data.formattedAddress,
      coordinates: data.location ? {
        lat: data.location.latitude,
        lng: data.location.longitude
      } : null
    };

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in google-places-details:', error);
    return new Response(
      JSON.stringify({ error: error.message, result: null }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
