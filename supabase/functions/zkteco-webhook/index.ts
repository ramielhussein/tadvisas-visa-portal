import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // ZKTeco devices can send data in different formats
    // Common formats: JSON, form-urlencoded, or custom protocol
    const contentType = req.headers.get('content-type') || '';
    
    let eventData: any;
    
    if (contentType.includes('application/json')) {
      eventData = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      eventData = Object.fromEntries(formData);
    } else {
      // Try to parse as text (some devices send raw data)
      const text = await req.text();
      console.log('[ZKTeco] Raw data received:', text);
      
      // Try JSON parse first
      try {
        eventData = JSON.parse(text);
      } catch {
        // Parse custom format if needed
        eventData = { raw: text };
      }
    }

    console.log('[ZKTeco] Webhook received:', JSON.stringify(eventData));

    // Extract common fields from ZKTeco data
    // Field names vary by device model, handle multiple formats
    const userId = eventData.user_id || eventData.UserId || eventData.uid || eventData.PIN || eventData.pin;
    const timestamp = eventData.timestamp || eventData.Timestamp || eventData.time || eventData.AttTime || eventData.punch_time;
    const punchType = eventData.punch_type || eventData.PunchType || eventData.status || eventData.Status || eventData.type;
    const deviceSn = eventData.sn || eventData.SN || eventData.DeviceSN || eventData.device_sn;

    if (!userId) {
      console.log('[ZKTeco] No user ID found in data');
      return new Response(
        JSON.stringify({ success: false, error: 'No user ID in payload' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find employee by employee_id or emirates_id
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, user_id, full_name, employee_id')
      .or(`employee_id.eq.${userId},emirates_id.eq.${userId}`)
      .single();

    if (empError || !employee) {
      console.log('[ZKTeco] Employee not found for ID:', userId);
      
      // Log the event anyway for debugging
      await supabase.from('audit_logs').insert({
        action: 'biometric_punch_unmatched',
        table_name: 'attendance_records',
        new_data: { user_id: userId, timestamp, punch_type: punchType, device_sn: deviceSn, raw: eventData }
      });

      return new Response(
        JSON.stringify({ success: false, error: 'Employee not found', user_id: userId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ZKTeco] Found employee:', employee.full_name);

    // Determine punch time
    const punchTime = timestamp ? new Date(timestamp) : new Date();
    const today = punchTime.toISOString().split('T')[0];

    // Check if attendance record exists for today
    const { data: existingRecord, error: recError } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('attendance_date', today)
      .single();

    // Determine if this is check-in or check-out
    // ZKTeco punch types: 0=Check-In, 1=Check-Out, 2=Break-Out, 3=Break-In, 4=OT-In, 5=OT-Out
    const isCheckIn = !punchType || punchType === 0 || punchType === '0' || punchType === 'in' || punchType === 'I';
    const isCheckOut = punchType === 1 || punchType === '1' || punchType === 'out' || punchType === 'O';
    const isBreakOut = punchType === 2 || punchType === '2';
    const isBreakIn = punchType === 3 || punchType === '3';

    if (!existingRecord) {
      // Create new attendance record with check-in
      const { data: newRecord, error: insertError } = await supabase
        .from('attendance_records')
        .insert({
          employee_id: employee.id,
          attendance_date: today,
          check_in_time: punchTime.toISOString(),
          status: 'present',
          notes: `Biometric check-in from device ${deviceSn || 'unknown'}`
        })
        .select()
        .single();

      if (insertError) {
        console.error('[ZKTeco] Error creating attendance record:', insertError);
        throw insertError;
      }

      console.log('[ZKTeco] Created check-in record for:', employee.full_name);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'check_in',
          employee: employee.full_name,
          time: punchTime.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update existing record
    if (isCheckOut && !existingRecord.check_out_time) {
      // Record check-out
      const { error: updateError } = await supabase
        .from('attendance_records')
        .update({
          check_out_time: punchTime.toISOString(),
          notes: (existingRecord.notes || '') + ` | Biometric check-out from device ${deviceSn || 'unknown'}`
        })
        .eq('id', existingRecord.id);

      if (updateError) throw updateError;

      console.log('[ZKTeco] Recorded check-out for:', employee.full_name);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'check_out',
          employee: employee.full_name,
          time: punchTime.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isBreakOut) {
      // Create break record
      const { error: breakError } = await supabase
        .from('break_records')
        .insert({
          attendance_record_id: existingRecord.id,
          break_out_time: punchTime.toISOString(),
          break_type: 'biometric'
        });

      if (breakError) throw breakError;

      console.log('[ZKTeco] Recorded break-out for:', employee.full_name);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'break_out',
          employee: employee.full_name,
          time: punchTime.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isBreakIn) {
      // Find open break and close it
      const { data: openBreak } = await supabase
        .from('break_records')
        .select('*')
        .eq('attendance_record_id', existingRecord.id)
        .is('break_back_time', null)
        .order('break_out_time', { ascending: false })
        .limit(1)
        .single();

      if (openBreak) {
        const breakDuration = Math.round(
          (punchTime.getTime() - new Date(openBreak.break_out_time).getTime()) / 60000
        );

        await supabase
          .from('break_records')
          .update({
            break_back_time: punchTime.toISOString(),
            break_duration_minutes: breakDuration
          })
          .eq('id', openBreak.id);

        // Update total break minutes
        await supabase
          .from('attendance_records')
          .update({
            total_break_minutes: existingRecord.total_break_minutes + breakDuration
          })
          .eq('id', existingRecord.id);

        console.log('[ZKTeco] Recorded break-in for:', employee.full_name, 'Duration:', breakDuration, 'mins');
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'break_in',
          employee: employee.full_name,
          time: punchTime.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default: if no check-in exists, treat as check-in
    if (!existingRecord.check_in_time) {
      await supabase
        .from('attendance_records')
        .update({
          check_in_time: punchTime.toISOString(),
          status: 'present'
        })
        .eq('id', existingRecord.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'check_in',
          employee: employee.full_name,
          time: punchTime.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        action: 'logged',
        message: 'Punch recorded but no action taken',
        employee: employee.full_name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ZKTeco] Webhook error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
