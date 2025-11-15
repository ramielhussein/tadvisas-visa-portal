import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ManyChatLead {
  full?: string
  phone?: string
  first_name?: string
  last_name?: string
  id?: string // ManyChat subscriber id (may be phone on WhatsApp)
  wa_id?: string // WhatsApp Cloud style id
  whatsapp_id?: string // possible custom mapping
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    console.log('Received ManyChat webhook:', JSON.stringify(payload, null, 2))

    // Extract lead data from ManyChat payload
    const leadData: ManyChatLead = payload
    const payloadAny: any = payload

    // Helper to sanitize to UAE 971 format
    const sanitizeToUAE = (input: string): string => {
      let cleaned = input.replace(/[^\d+]/g, '')
      if (cleaned.startsWith('+971')) cleaned = cleaned.slice(1)
      else if (cleaned.startsWith('00971')) cleaned = cleaned.slice(2)
      else if (cleaned.startsWith('0') && cleaned.length === 10) cleaned = '971' + cleaned.slice(1)
      return cleaned
    }

    // Prefer WhatsApp phone/id only
    const candidates: Array<{ value?: string; source: string }> = [
      { value: leadData.phone, source: 'phone' },
      { value: payloadAny?.wa_id, source: 'wa_id' },
      { value: payloadAny?.whatsapp_id, source: 'whatsapp_id' },
      { value: payloadAny?.contact?.wa_id, source: 'contact.wa_id' },
      { value: leadData.id, source: 'id' },
      { value: leadData.first_name, source: 'first_name' }, // some tests had phone here
      { value: leadData.last_name, source: 'last_name' },
    ]

    const picked = candidates.find(c => typeof c.value === 'string' && c.value && !c.value.includes('{{'))
    const rawPhone = picked?.value || ''

    if (!rawPhone) {
      throw new Error('No WhatsApp ID/phone provided')
    }

    const cleanPhone = sanitizeToUAE(rawPhone)

    // Validate UAE format 971XXXXXXXXX
    if (!/^971\d{9}$/.test(cleanPhone)) {
      throw new Error('Invalid phone format. Expect 971XXXXXXXXX')
    }

    console.log('Using phone from:', picked?.source, '->', cleanPhone)

    // Get full name (support both formats)
    const fullName = leadData.full || 
      [leadData.first_name, leadData.last_name]
        .filter((n) => typeof n === 'string' && !n.includes('{{')) // Filter out template variables
        .join(' ') || 
      'ManyChat WhatsApp Lead'

    // Check if lead already exists
    const { data: existingLead } = await supabaseClient
      .from('leads')
      .select('id, mobile_number')
      .eq('mobile_number', cleanPhone)
      .single()

    if (existingLead) {
      console.log('Lead already exists:', existingLead.id)
      
      // Get full lead details including assignment
      const { data: fullLead } = await supabaseClient
        .from('leads')
        .select('id, client_name, assigned_to')
        .eq('id', existingLead.id)
        .single()
      
      // If lead is assigned, notify the salesman
      if (fullLead?.assigned_to) {
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: fullLead.assigned_to,
            title: 'Repeat Contact via ManyChat',
            message: `${fullLead.client_name || 'Lead'} (${cleanPhone}) contacted again via ManyChat`,
            type: 'lead_update',
            related_lead_id: fullLead.id
          })
        console.log('Notified assigned salesman:', fullLead.assigned_to)
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Lead already exists - salesman notified',
          leadId: existingLead.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fixed values for consistency
    const serviceRequired = 'P1 Traditional Package'
    const leadSource = 'Many Chat Braodcast'

    // Create new lead
    const { data: newLead, error: insertError } = await supabaseClient
      .from('leads')
      .insert({
        client_name: fullName,
        mobile_number: cleanPhone,
        lead_source: leadSource,
        service_required: serviceRequired,
        status: 'New Lead',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating lead:', insertError)
      throw insertError
    }

    console.log('Lead created successfully:', newLead.id)

    // Try to assign via round-robin
    try {
      await supabaseClient.functions.invoke('assign-lead-round-robin', {
        body: { leadId: newLead.id }
      })
      console.log('Round-robin assignment triggered')
    } catch (assignError) {
      console.log('Round-robin assignment skipped or failed:', assignError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Lead created successfully',
        leadId: newLead.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing ManyChat webhook:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
