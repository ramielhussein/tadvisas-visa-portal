import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Helper function to convert ArrayBuffer to hex string
function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = authHeader.slice('Bearer '.length).trim();
    if (!apiKey) {
      console.error('Empty bearer token');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const keyHash = toHex(hashBuffer);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify API key exists and is active
    const { data: keyRecord, error: keyError } = await supabase
      .from('sop_api_keys')
      .select('id, is_active')
      .eq('key_hash', keyHash)
      .single();

    if (keyError || !keyRecord || !keyRecord.is_active) {
      console.error('Invalid or inactive API key');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update last_used_at
    await supabase
      .from('sop_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyRecord.id);

    // Parse request body
    const body = await req.json();
    console.log('Received SOP webhook payload:', JSON.stringify(body));

    const { action, slug, title, content, parent_slug, description } = body;

    // Validate required fields
    if (!action || action !== 'upsert') {
      return new Response(JSON.stringify({ error: 'Invalid action. Only "upsert" is supported.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!slug || !title || !content) {
      return new Response(JSON.stringify({ error: 'Missing required fields: slug, title, content' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve parent_id from parent_slug if provided
    let parent_id = null;
    if (parent_slug) {
      const { data: parentPage, error: parentError } = await supabase
        .from('sop_pages')
        .select('id')
        .eq('slug', parent_slug)
        .single();

      if (parentError) {
        console.warn(`Parent slug "${parent_slug}" not found, creating without parent`);
      } else {
        parent_id = parentPage.id;
      }
    }

    // Upsert the SOP page
    const { data: page, error: upsertError } = await supabase
      .from('sop_pages')
      .upsert(
        {
          slug,
          title,
          content,
          description: description || null,
          parent_id,
          is_published: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'slug',
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting SOP page:', upsertError);
      return new Response(JSON.stringify({ error: 'Failed to upsert page', details: upsertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully upserted SOP page:', page.slug);

    return new Response(JSON.stringify({ success: true, page }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error in sop-webhook:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
