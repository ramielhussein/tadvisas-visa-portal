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
    // Log all incoming requests for debugging
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams);
    
    console.log('[ZKTeco] Request received');
    console.log('[ZKTeco] Method:', req.method);
    console.log('[ZKTeco] URL:', req.url);
    console.log('[ZKTeco] Query params:', JSON.stringify(queryParams));
    console.log('[ZKTeco] Headers:', JSON.stringify(Object.fromEntries(req.headers)));

    const contentType = req.headers.get('content-type') || '';
    let eventData: any;
    let rawBody = '';
    
    if (contentType.includes('application/json')) {
      rawBody = await req.text();
      console.log('[ZKTeco] Raw JSON body:', rawBody);
      eventData = JSON.parse(rawBody);
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      rawBody = await req.text();
      console.log('[ZKTeco] Form data:', rawBody);
      const params = new URLSearchParams(rawBody);
      eventData = Object.fromEntries(params);
    } else {
      rawBody = await req.text();
      console.log('[ZKTeco] Raw text body:', rawBody);
      
      try {
        eventData = JSON.parse(rawBody);
      } catch {
        eventData = { raw: rawBody };
      }
    }

    console.log('[ZKTeco] Parsed data:', JSON.stringify(eventData));

    // Handle BioTime 9.5 RealTime format
    // Example: { "RealTime": { "PunchLog": { "UserId": "1", "LogTime": "...", "Type": "CheckIn" } } }
    let userId: string | undefined;
    let timestamp: string | undefined;
    let punchType: string | number | undefined;
    let deviceSn: string | undefined;

    if (eventData.RealTime?.PunchLog) {
      // BioTime format
      const punchLog = eventData.RealTime.PunchLog;
      userId = punchLog.UserId || punchLog.user_id;
      timestamp = punchLog.LogTime || punchLog.log_time;
      punchType = punchLog.Type || punchLog.type;
      deviceSn = eventData.RealTime.DeviceSN || eventData.RealTime.device_sn;
      console.log('[ZKTeco] BioTime format detected');
    } else {
      // Generic ZKTeco format
      userId = eventData.user_id || eventData.UserId || eventData.uid || eventData.PIN || eventData.pin || eventData.empcode;
      timestamp = eventData.timestamp || eventData.Timestamp || eventData.time || eventData.AttTime || eventData.punch_time || eventData.checktime;
      punchType = eventData.punch_type || eventData.PunchType || eventData.status || eventData.Status || eventData.type || eventData.checktype;
      deviceSn = eventData.sn || eventData.SN || eventData.DeviceSN || eventData.device_sn;
    }

    // Also check query params for data
    if (!userId && queryParams.pin) userId = queryParams.pin;
    if (!userId && queryParams.user_id) userId = queryParams.user_id;
    if (!timestamp && queryParams.time) timestamp = queryParams.time;

    console.log('[ZKTeco] Extracted - userId:', userId, 'timestamp:', timestamp, 'punchType:', punchType);

    if (!userId) {
      console.log('[ZKTeco] No user ID found in data');
      
      // Log raw data for debugging
      await supabase.from('audit_logs').insert({
        action: 'biometric_webhook_no_user',
        new_data: { 
          raw_body: rawBody,
          parsed: eventData,
          query_params: queryParams,
          content_type: contentType
        }
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Logged but no user ID found' }),
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
    const { data: existingRecord } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('attendance_date', today)
      .single();

    // Determine punch type
    // BioTime types: "CheckIn", "CheckOut", "BreakOut", "BreakIn", "OvertimeIn", "OvertimeOut"
    // ZKTeco numeric: 0=Check-In, 1=Check-Out, 2=Break-Out, 3=Break-In
    const typeStr = String(punchType || '').toLowerCase();
    const isCheckIn = !punchType || punchType === 0 || punchType === '0' || 
                      typeStr === 'checkin' || typeStr === 'check-in' || typeStr === 'in' || typeStr === 'i';
    const isCheckOut = punchType === 1 || punchType === '1' || 
                       typeStr === 'checkout' || typeStr === 'check-out' || typeStr === 'out' || typeStr === 'o';
    const isBreakOut = punchType === 2 || punchType === '2' || typeStr === 'breakout' || typeStr === 'break-out';
    const isBreakIn = punchType === 3 || punchType === '3' || typeStr === 'breakin' || typeStr === 'break-in';

    if (!existingRecord) {
      // Create new attendance record with check-in
      const { error: insertError } = await supabase
        .from('attendance_records')
        .insert({
          employee_id: employee.id,
          attendance_date: today,
          check_in_time: punchTime.toISOString(),
          status: 'present',
          notes: `Biometric check-in from device ${deviceSn || 'BioTime'}`
        });

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
      const { error: updateError } = await supabase
        .from('attendance_records')
        .update({
          check_out_time: punchTime.toISOString(),
          notes: (existingRecord.notes || '') + ` | Biometric check-out`
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

        await supabase
          .from('attendance_records')
          .update({
            total_break_minutes: existingRecord.total_break_minutes + breakDuration
          })
          .eq('id', existingRecord.id);

        console.log('[ZKTeco] Recorded break-in for:', employee.full_name);
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
        message: 'Punch recorded',
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
