import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting sales team creation...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const salesEmails = [
      'sales1@tadmaids.com',
      'sales2@tadmaids.com',
      'sales3@tadmaids.com',
      'sales4@tadmaids.com',
      'sales5@tadmaids.com',
      'sales6@tadmaids.com',
      'sales7@tadmaids.com',
    ];

    const password = 'mirami98';
    const createdUsers = [];
    const errors = [];

    for (const email of salesEmails) {
      try {
        console.log(`Creating user: ${email}`);
        
        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (authError) {
          console.error(`Error creating auth user ${email}:`, authError);
          errors.push({ email, error: authError.message });
          continue;
        }

        console.log(`User ${email} created successfully with ID: ${authData.user.id}`);
        createdUsers.push({ email, id: authData.user.id });
      } catch (error) {
        console.error(`Exception creating user ${email}:`, error);
        errors.push({ email, error: error.message });
      }
    }

    console.log(`Sales team creation complete. Created: ${createdUsers.length}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        created: createdUsers,
        errors,
        message: `Created ${createdUsers.length} users. ${errors.length} errors.`,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-sales-team function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
