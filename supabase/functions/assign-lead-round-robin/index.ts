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
    const { leadId } = await req.json();
    
    if (!leadId) {
      throw new Error('Lead ID is required');
    }

    console.log('Assigning lead via round robin:', leadId);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if round robin is enabled
    const { data: setting, error: settingError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'round_robin_enabled')
      .maybeSingle();

    if (settingError) {
      console.error('Error checking round robin setting:', settingError);
      throw settingError;
    }

    if (setting?.value !== 'true') {
      console.log('Round robin is disabled, skipping assignment');
      return new Response(
        JSON.stringify({ success: true, message: 'Round robin disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all sales team members (users with email starting with sales) who are active
    const { data: salesUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('email', 'sales%@tadmaids.com')
      .order('email');

    if (usersError) {
      console.error('Error fetching sales users:', usersError);
      throw usersError;
    }

    if (!salesUsers || salesUsers.length === 0) {
      console.log('No sales users found, skipping assignment');
      return new Response(
        JSON.stringify({ success: true, message: 'No sales users available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active status for each user
    const { data: activeSettings, error: activeError } = await supabase
      .from('settings')
      .select('key, value')
      .like('key', 'sales_active_%');

    if (activeError && activeError.code !== 'PGRST116') {
      console.error('Error fetching active settings:', activeError);
      throw activeError;
    }

    // Create map of active users
    const activeMap = new Map(
      (activeSettings || []).map(s => [s.key.replace('sales_active_', ''), s.value === 'true'])
    );

    // Filter to only active users (default to active if not set)
    const activeUsers = salesUsers.filter(user => activeMap.get(user.id) !== false);

    if (activeUsers.length === 0) {
      console.log('No active sales users found, skipping assignment');
      return new Response(
        JSON.stringify({ success: true, message: 'No active sales users available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current round robin index
    const { data: indexSetting, error: indexError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'round_robin_index')
      .maybeSingle();

    if (indexError && indexError.code !== 'PGRST116') {
      console.error('Error fetching round robin index:', indexError);
      throw indexError;
    }

    const currentIndex = indexSetting?.value ? parseInt(indexSetting.value) : 0;
    const nextIndex = (currentIndex + 1) % activeUsers.length;
    const assignedUser = activeUsers[currentIndex];

    console.log(`Assigning lead to user ${assignedUser.email} (index ${currentIndex} of ${activeUsers.length} active users)`);

    // Get lead details for notification
    const { data: leadData } = await supabase
      .from('leads')
      .select('client_name, mobile_number')
      .eq('id', leadId)
      .single();

    // Assign the lead
    const { error: updateError } = await supabase
      .from('leads')
      .update({ assigned_to: assignedUser.id })
      .eq('id', leadId);

    if (updateError) {
      console.error('Error updating lead assignment:', updateError);
      throw updateError;
    }

    // Create notification for the assigned user
    try {
      await supabase.from('notifications').insert({
        user_id: assignedUser.id,
        title: 'New Lead Assigned (Round Robin)',
        message: `You have been assigned a new lead via round robin: ${leadData?.client_name || leadData?.mobile_number || 'Unknown'}`,
        type: 'info',
        related_lead_id: leadId,
      });
      console.log(`Notification created for ${assignedUser.email}`);
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't throw - assignment was successful
    }

    // Update the round robin index
    const { error: updateIndexError } = await supabase
      .from('settings')
      .upsert({
        key: 'round_robin_index',
        value: nextIndex.toString(),
      }, {
        onConflict: 'key'
      });

    if (updateIndexError) {
      console.error('Error updating round robin index:', updateIndexError);
      // Don't throw - the assignment was successful
    }

    console.log(`Lead assigned successfully. Next index: ${nextIndex}`);

    return new Response(
      JSON.stringify({
        success: true,
        assignedTo: assignedUser.email,
        nextIndex,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in assign-lead-round-robin:', error);
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
