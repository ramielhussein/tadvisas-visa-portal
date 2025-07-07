
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Edge function called with method:', req.method)
    
    const formData = await req.formData()
    console.log('Form data received')
    
    // Extract form fields
    const name = formData.get('name') as string
    const number = formData.get('number') as string
    const email = formData.get('email') as string
    
    console.log('Extracted form fields:', { name, number, email })
    
    // Extract files
    const emiratesId = formData.get('emiratesId') as File
    const dewaBill = formData.get('dewaBill') as File
    const maidPassport = formData.get('maidPassport') as File
    const maidVisa = formData.get('maidVisa') as File
    const maidPhoto = formData.get('maidPhoto') as File

    console.log('Files received:', {
      emiratesId: emiratesId ? emiratesId.name : 'None',
      dewaBill: dewaBill ? dewaBill.name : 'None',
      maidPassport: maidPassport ? maidPassport.name : 'None',
      maidVisa: maidVisa ? maidVisa.name : 'None',
      maidPhoto: maidPhoto ? maidPhoto.name : 'None'
    })

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found in environment variables')
      throw new Error('RESEND_API_KEY not found in environment variables')
    }

    // Create email content
    const emailContent = `
      <h2>New Application Submission</h2>
      
      <h3>Personal Information:</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Phone:</strong> ${number}</p>
      <p><strong>Email:</strong> ${email}</p>
      
      <h3>Documents uploaded:</h3>
      <ul>
        <li><strong>Emirates ID:</strong> ${emiratesId ? emiratesId.name : 'Not provided'}</li>
        <li><strong>DEWA/ETISALAT Bill:</strong> ${dewaBill ? dewaBill.name : 'Not provided'}</li>
        <li><strong>Maid Passport:</strong> ${maidPassport ? maidPassport.name : 'Not provided'}</li>
        <li><strong>Maid Visa:</strong> ${maidVisa ? maidVisa.name : 'Not provided'}</li>
        <li><strong>Maid Photo:</strong> ${maidPhoto ? maidPhoto.name : 'Not provided'}</li>
      </ul>
    `

    console.log('Sending email...')

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TAD Visas <noreply@tadvisas.com>',
        to: ['info@tadvisas.com'],
        subject: 'New Application Submission',
        html: emailContent,
      }),
    })

    console.log('Email response status:', emailResponse.status)

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('Email sending failed:', errorData)
      throw new Error(`Failed to send email: ${errorData}`)
    }

    console.log('Email sent successfully')
    
    return new Response(
      JSON.stringify({ success: true, message: 'Application submitted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
