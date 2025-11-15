import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ManyChatLead {
  first_name?: string
  last_name?: string
  phone?: string
  email?: string
  custom_fields?: Record<string, any>
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

    // Build client name
    const clientName = [leadData.first_name, leadData.last_name]
      .filter(Boolean)
      .join(' ') || 'ManyChat Lead'

    // Validate phone number
    if (!leadData.phone) {
      throw new Error('Phone number is required')
    }

    // Clean phone number (remove spaces, dashes, etc)
    const cleanPhone = leadData.phone.replace(/[^\d+]/g, '')

    // Check if lead already exists
    const { data: existingLead } = await supabaseClient
      .from('leads')
      .select('id, mobile_number')
      .eq('mobile_number', cleanPhone)
      .single()

    if (existingLead) {
      console.log('Lead already exists:', existingLead.id)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Lead already exists',
          leadId: existingLead.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract service type from custom fields if available
    const serviceRequired = leadData.custom_fields?.service || 'ManyChat Inquiry'

    // Create new lead
    const { data: newLead, error: insertError } = await supabaseClient
      .from('leads')
      .insert({
        client_name: clientName,
        mobile_number: cleanPhone,
        email: leadData.email || null,
        lead_source: 'ManyChat',
        service_required: serviceRequired,
        status: 'New Lead',
        comments: leadData.custom_fields ? 
          JSON.stringify(leadData.custom_fields, null, 2) : null,
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
