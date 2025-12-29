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
    const { query } = await req.json();
    
    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ predictions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      throw new Error('Google Places API key not configured');
    }

    console.log(`Searching for: "${query}"`);

    // Use Places API (New) - Place Autocomplete
    const url = new URL('https://places.googleapis.com/v1/places:autocomplete');
    
    const requestBody = {
      input: query,
      includedRegionCodes: ['ae'], // Restrict to UAE
      languageCode: 'en',
      locationBias: {
        circle: {
          center: {
            latitude: 25.0772,  // Dubai Marina area
            longitude: 55.1385
          },
          radius: 50000.0  // 50km radius to cover Dubai
        }
      },
      includedPrimaryTypes: [
        'establishment',
        'geocode',
        'address',
        'point_of_interest',
        'locality',
        'sublocality',
        'neighborhood',
        'route'
      ]
    };

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Places API error:', response.status, errorText);
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Found ${data.suggestions?.length || 0} suggestions`);

    // Transform to a simpler format
    const predictions = (data.suggestions || []).map((suggestion: any) => ({
      place_id: suggestion.placePrediction?.placeId,
      description: suggestion.placePrediction?.text?.text,
      main_text: suggestion.placePrediction?.structuredFormat?.mainText?.text,
      secondary_text: suggestion.placePrediction?.structuredFormat?.secondaryText?.text
    }));

    return new Response(
      JSON.stringify({ predictions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in google-places-autocomplete:', error);
    return new Response(
      JSON.stringify({ error: error.message, predictions: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
