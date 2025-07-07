import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    
    // Extract form fields
    const name = formData.get('name') as string
    const number = formData.get('number') as string
    const email = formData.get('email') as string
    
    // Extract files
    const emiratesId = formData.get('emiratesId') as File
    const dewaBill = formData.get('dewaBill') as File
    const maidPassport = formData.get('maidPassport') as File
    const maidVisa = formData.get('maidVisa') as File
    const maidPhoto = formData.get('maidPhoto') as File

    // Create email content
    const emailContent = `
      New Application Submission:
      
      Name: ${name}
      Phone: ${number}
      Email: ${email}
      
      Documents uploaded:
      - Emirates ID: ${emiratesId ? emiratesId.name : 'Not provided'}
      - DEWA/ETISALAT Bill: ${dewaBill ? dewaBill.name : 'Not provided'}
      - Maid Passport: ${maidPassport ? maidPassport.name : 'Not provided'}
      - Maid Visa: ${maidVisa ? maidVisa.name : 'Not provided'}
      - Maid Photo: ${maidPhoto ? maidPhoto.name : 'Not provided'}
    `

    // For now, we'll return success - you'll need to integrate with an email service
    // Popular options: Resend, SendGrid, or SMTP
    console.log('Email would be sent to info@tadvisas.com with content:', emailContent)
    
    return new Response(
      JSON.stringify({ success: true, message: 'Application submitted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})