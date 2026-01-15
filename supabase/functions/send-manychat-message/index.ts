import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendMessageRequest {
  phone: string
  message: string
  leadId?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const MANYCHAT_API_KEY = Deno.env.get('MANYCHAT_API_KEY')
    if (!MANYCHAT_API_KEY) {
      throw new Error('MANYCHAT_API_KEY not configured')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { phone, message, leadId }: SendMessageRequest = await req.json()

    if (!phone || !message) {
      throw new Error('Phone and message are required')
    }

    // Sanitize phone to 971 format
    let cleanPhone = phone.replace(/[^\d+]/g, '')
    if (cleanPhone.startsWith('+971')) cleanPhone = cleanPhone.slice(1)
    else if (cleanPhone.startsWith('00971')) cleanPhone = cleanPhone.slice(2)
    else if (cleanPhone.startsWith('0') && cleanPhone.length === 10) cleanPhone = '971' + cleanPhone.slice(1)

    console.log('Sending ManyChat message to:', cleanPhone)

    // ManyChat WhatsApp API - Send message by phone
    // Using the external API endpoint for WhatsApp
    const manyChatResponse = await fetch('https://api.manychat.com/fb/sending/sendContent', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriber_id: cleanPhone, // For WhatsApp, this is the phone number
        data: {
          version: 'v2',
          content: {
            messages: [
              {
                type: 'text',
                text: message
              }
            ]
          }
        }
      })
    })

    const manyChatResult = await manyChatResponse.json()
    console.log('ManyChat API response:', JSON.stringify(manyChatResult))

    // If first method fails, try finding subscriber by phone first
    if (!manyChatResponse.ok || manyChatResult.status === 'error') {
      console.log('First method failed, trying to find subscriber by phone...')
      
      // Try to find subscriber by phone number using WhatsApp API
      const findSubResponse = await fetch(`https://api.manychat.com/fb/subscriber/findBySystemField`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field_name: 'phone',
          field_value: cleanPhone
        })
      })

      let findSubResult
      const findSubText = await findSubResponse.text()
      try {
        findSubResult = JSON.parse(findSubText)
      } catch {
        console.error('Failed to parse findSubscriber response:', findSubText.substring(0, 200))
        throw new Error(`ManyChat API returned invalid response. The subscriber with phone ${cleanPhone} may not exist in ManyChat. They need to message your WhatsApp bot first.`)
      }
      
      console.log('Find subscriber response:', JSON.stringify(findSubResult))

      if (findSubResult.status === 'success' && findSubResult.data?.id) {
        // Found subscriber, now send message
        const sendResponse = await fetch('https://api.manychat.com/fb/sending/sendContent', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriber_id: findSubResult.data.id,
            data: {
              version: 'v2',
              content: {
                messages: [{ type: 'text', text: message }]
              }
            }
          })
        })

        let sendResult
        const sendText = await sendResponse.text()
        try {
          sendResult = JSON.parse(sendText)
        } catch {
          console.error('Failed to parse send response:', sendText.substring(0, 200))
          throw new Error('Failed to send message via ManyChat')
        }
        
        console.log('Send message response:', JSON.stringify(sendResult))
        
        if (sendResult.status !== 'success') {
          throw new Error(`ManyChat send error: ${sendResult.message || 'Unknown error'}`)
        }
      } else {
        throw new Error(`Subscriber not found in ManyChat. The contact needs to message your WhatsApp bot first before you can send them messages.`)
      }
    }

    // Log activity if leadId provided
    if (leadId) {
      await supabaseClient.from('lead_activities').insert({
        lead_id: leadId,
        user_id: user.id,
        activity_type: 'whatsapp',
        title: 'ManyChat Message Sent',
        description: `Sent via ManyChat API: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`,
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Message sent successfully',
        phone: cleanPhone
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending ManyChat message:', error)
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
