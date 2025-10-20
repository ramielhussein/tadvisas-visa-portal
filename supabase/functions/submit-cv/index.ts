import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
interface CVFormData {
  name: string;
  passport_no: string;
  passport_expiry: string;
  nationality_code: string;
  age: number;
  religion: string;
  maid_status: string;
  job1: string;
  job2: string;
  height_cm: number;
  weight_kg: number;
  marital_status: string;
  children: number;
  languages: Array<{ name: string; level: string }>;
  education: any;
  experience: Array<{ country: string; years: number }>;
  skills: any;
  visa: any;
  files: any;
  financials: any;
  salary?: number;
  consent: boolean;
}

function computeCenterRef(data: CVFormData): string {
  const code = data.nationality_code;
  
  // TYPE priority: Driver(5) > Caregiver(4) > Cook(3) > Tutor(6) > Experienced(2) > First Timer(1)
  let type = 1; // First Timer
  
  if (data.job1 === 'Driver' || data.job2 === 'Driver') type = 5;
  else if (data.job1 === 'Caregiver' || data.job2 === 'Caregiver') type = 4;
  else if (data.job1 === 'Cook' || data.job2 === 'Cook') type = 3;
  else if (data.job1 === 'Tutor' || data.job2 === 'Tutor') type = 6;
  else if (data.experience.length > 0) type = 2;
  
  return `${code} ${type} ${data.name}`;
}

async function uploadFile(
  supabase: any,
  passportNo: string,
  file: any,
  fileName: string
): Promise<string | null> {
  if (!file) return null;
  
  const filePath = `${passportNo}/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('cvs')
    .upload(filePath, file, {
      upsert: true,
    });
  
  if (error) {
    console.error(`Error uploading ${fileName}:`, error);
    return null;
  }
  
  const { data: urlData } = supabase.storage
    .from('cvs')
    .getPublicUrl(filePath);
  
  return urlData.publicUrl;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const formData: CVFormData = await req.json();
    
    console.log('Processing CV submission for:', formData.passport_no);
    
    // Compute center reference
    const center_ref = computeCenterRef(formData);
    
    // Compute employer count
    const employer_count = 0; // Will be added later when employer feature is implemented
    
    // Compute financials
    const total_cost = formData.financials.costs.reduce((sum: number, c: any) => sum + c.amount, 0);
    const total_revenue = formData.financials.revenues.reduce((sum: number, r: any) => sum + r.amount, 0);
    const pnl = total_revenue - total_cost;
    
    const financials = {
      costs: formData.financials.costs,
      revenues: formData.financials.revenues,
      total_cost,
      total_revenue,
      pnl,
    };
    
    // Upload files to storage
    const fileUrls: any = {};
    
    // Note: In a real implementation, you'd need to handle multipart/form-data
    // For now, this is a placeholder structure
    
    // Create the worker record
    const { data: worker, error: insertError } = await supabase
      .from('workers')
      .insert({
        passport_no: formData.passport_no,
        passport_expiry: formData.passport_expiry,
        center_ref,
        name: formData.name,
        age: formData.age,
        religion: formData.religion,
        nationality_code: formData.nationality_code,
        maid_status: formData.maid_status,
        job1: formData.job1,
        job2: formData.job2,
        height_cm: formData.height_cm,
        weight_kg: formData.weight_kg,
        marital_status: formData.marital_status,
        children: formData.children,
        languages: formData.languages,
        education: formData.education,
        experience: formData.experience,
        skills: formData.skills,
        visa: formData.visa,
        files: fileUrls,
        employers: [],
        employer_count,
        financials,
        salary: formData.salary,
        status: 'Available',
      })
      .select()
      .single();
    
    if (insertError) {
      throw insertError;
    }
    
    console.log('Worker created:', worker.id);
    
    // Get webhook URL from settings
    const { data: webhookSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'make_webhook_url')
      .maybeSingle();
    
    // If webhook is configured, send data to Make
    if (webhookSetting?.value) {
      console.log('Sending to Make webhook...');
      
      const payload = {
        center_ref,
        passport_no: formData.passport_no,
        passport_expiry: formData.passport_expiry,
        name: formData.name,
        age: formData.age,
        religion: formData.religion,
        nationality_code: formData.nationality_code,
        maid_status: formData.maid_status,
        job1: formData.job1,
        job2: formData.job2,
        height_cm: formData.height_cm,
        weight_kg: formData.weight_kg,
        marital_status: formData.marital_status,
        children: formData.children,
        languages: formData.languages,
        education: formData.education,
        experience: formData.experience,
        skills: formData.skills,
        visa: formData.visa,
        files: fileUrls,
        employers: [],
        employer_count,
        financials,
        status: 'Available',
        created_at: new Date().toISOString(),
      };
      
      try {
        const webhookResponse = await fetch(webhookSetting.value, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        console.log('Make webhook response:', webhookResponse.status);
      } catch (webhookError) {
        console.error('Webhook error (non-blocking):', webhookError);
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, center_ref, worker_id: worker.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
