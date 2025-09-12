import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

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
    const packageType = formData.get('package') as string
    const addons = formData.getAll('addons') as string[]
    
    console.log('Extracted form fields:', { name, number, email, packageType, addons })
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Extract and upload files
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

    // Upload files to Supabase Storage
    const uploadFile = async (file: File | null, folder: string) => {
      if (!file) return null
      
      const fileName = `${folder}/${Date.now()}-${file.name}`
      const arrayBuffer = await file.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)
      
      const { data, error } = await supabase.storage
        .from('submission-documents')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false
        })
      
      if (error) {
        console.error(`Error uploading ${folder}:`, error)
        return null
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('submission-documents')
        .getPublicUrl(fileName)
      
      return publicUrl
    }
    
    // Upload all files
    const [emiratesIdUrl, dewaBillUrl, maidPassportUrl, maidVisaUrl, maidPhotoUrl] = await Promise.all([
      uploadFile(emiratesId, 'emirates-ids'),
      uploadFile(dewaBill, 'dewa-bills'),
      uploadFile(maidPassport, 'maid-passports'),
      uploadFile(maidVisa, 'maid-visas'),
      uploadFile(maidPhoto, 'maid-photos')
    ])
    
    console.log('Files uploaded successfully')
    
    // Save to database
    const { data: submission, error: dbError } = await supabase
      .from('submissions')
      .insert({
        name,
        phone: number,
        email,
        package: packageType,
        addons,
        emirates_id_url: emiratesIdUrl,
        dewa_bill_url: dewaBillUrl,
        maid_passport_url: maidPassportUrl,
        maid_visa_url: maidVisaUrl,
        maid_photo_url: maidPhotoUrl
      })
      .select()
      .single()
    
    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error(`Failed to save submission: ${dbError.message}`)
    }
    
    console.log('Submission saved to database:', submission)

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found in environment variables')
      throw new Error('RESEND_API_KEY not found in environment variables')
    }

    // Create email content with file URLs
    const emailContent = `
      <h2>New Application Submission</h2>
      
      <h3>Personal Information:</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Phone:</strong> ${number}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Package:</strong> ${packageType || 'Not selected'}</p>
      <p><strong>Add-ons:</strong> ${addons.length > 0 ? addons.join(', ') : 'None'}</p>
      
      <h3>Documents uploaded:</h3>
      <ul>
        <li><strong>Emirates ID:</strong> ${emiratesId ? `<a href="${emiratesIdUrl}">${emiratesId.name}</a>` : 'Not provided'}</li>
        <li><strong>DEWA/ETISALAT Bill:</strong> ${dewaBill ? `<a href="${dewaBillUrl}">${dewaBill.name}</a>` : 'Not provided'}</li>
        <li><strong>Maid Passport:</strong> ${maidPassport ? `<a href="${maidPassportUrl}">${maidPassport.name}</a>` : 'Not provided'}</li>
        <li><strong>Maid Visa:</strong> ${maidVisa ? `<a href="${maidVisaUrl}">${maidVisa.name}</a>` : 'Not provided'}</li>
        <li><strong>Maid Photo:</strong> ${maidPhoto ? `<a href="${maidPhotoUrl}">${maidPhoto.name}</a>` : 'Not provided'}</li>
      </ul>
      
      <p><strong>Submission ID:</strong> ${submission?.id}</p>
      <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
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
        to: ['tadbeer@tadmaids.com'],
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
      JSON.stringify({ success: true, message: 'Application submitted successfully', submissionId: submission?.id }),
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