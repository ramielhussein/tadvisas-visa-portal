import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { read, utils } from 'https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadRow {
  client_name?: string;
  email?: string;
  mobile_number: string;
  emirate?: string;
  nationality_code?: string;
  service_required?: string;
  status?: string;
}

interface ImportResult {
  total: number;
  imported: number;
  duplicates: number;
  errors: number;
  duplicateNumbers: string[];
  errorDetails: Array<{ row: number; error: string }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      throw new Error('Only admins can import leads');
    }

    // Get the file from the request
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log('Processing file:', file.name, 'Size:', file.size);

    // Read the Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = read(arrayBuffer);
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = utils.sheet_to_json(worksheet) as any[];
    
    console.log(`Found ${jsonData.length} rows in Excel file`);

    const result: ImportResult = {
      total: jsonData.length,
      imported: 0,
      duplicates: 0,
      errors: 0,
      duplicateNumbers: [],
      errorDetails: [],
    };

    // Normalize status values to match database enum
    const normalizeStatus = (rawStatus: string | undefined): string => {
      if (!rawStatus) return 'New Lead';
      
      const status = String(rawStatus).toLowerCase().trim();
      
      // Map common status variations to valid enum values
      if (status.includes('new') || status.includes('lead')) return 'New Lead';
      if (status.includes('warm')) return 'Warm';
      if (status.includes('hot')) return 'HOT';
      if (status.includes('sold') || status.includes('won') || status.includes('win')) return 'SOLD';
      if (status.includes('lost') || status.includes('lose')) return 'LOST';
      if (status.includes('problem') || status.includes('issue')) return 'PROBLEM';
      
      // Default to New Lead if status doesn't match any pattern
      return 'New Lead';
    };

    // Normalize column names (handle different possible column names)
    const normalizeColumnName = (row: any): LeadRow | null => {
      try {
        // Find the mobile number field (try various common names)
        const mobileField = Object.keys(row).find(key => 
          key.toLowerCase().includes('mobile') || 
          key.toLowerCase().includes('phone') ||
          key.toLowerCase().includes('number')
        );

        if (!mobileField || !row[mobileField]) {
          return null;
        }

        // Clean and validate phone number
        let mobile = String(row[mobileField]).replace(/[\s-]/g, '');
        
        // If doesn't start with 971, try to add it
        if (!mobile.startsWith('971') && mobile.length === 9) {
          mobile = '971' + mobile;
        }

        // Validate format
        if (!mobile.startsWith('971') || mobile.length !== 12) {
          return null;
        }

        // Map other fields (try to find them with flexible matching)
        const nameField = Object.keys(row).find(key => 
          key.toLowerCase().includes('name') || key.toLowerCase().includes('client')
        );
        
        const emailField = Object.keys(row).find(key => 
          key.toLowerCase().includes('email')
        );
        
        const emirateField = Object.keys(row).find(key => 
          key.toLowerCase().includes('emirate') || key.toLowerCase().includes('city')
        );
        
        const nationalityField = Object.keys(row).find(key => 
          key.toLowerCase().includes('nationality') || key.toLowerCase().includes('country')
        );
        
        const serviceField = Object.keys(row).find(key => 
          key.toLowerCase().includes('service') || key.toLowerCase().includes('package')
        );
        
        const statusField = Object.keys(row).find(key => 
          key.toLowerCase().includes('status')
        );

        return {
          mobile_number: mobile,
          client_name: nameField ? row[nameField] : undefined,
          email: emailField ? row[emailField] : undefined,
          emirate: emirateField ? row[emirateField] : undefined,
          nationality_code: nationalityField ? row[nationalityField] : undefined,
          service_required: serviceField ? row[serviceField] : undefined,
          status: normalizeStatus(statusField ? row[statusField] : undefined),
        };
      } catch (error) {
        console.error('Error normalizing row:', error);
        return null;
      }
    };

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2; // Excel rows start at 1, plus header row

      try {
        const lead = normalizeColumnName(row);
        
        if (!lead) {
          result.errors++;
          result.errorDetails.push({
            row: rowNumber,
            error: 'Invalid or missing phone number',
          });
          continue;
        }

        // Try to insert the lead
        const { error: insertError } = await supabase
          .from('leads')
          .insert([lead]);

        if (insertError) {
          // Check if it's a duplicate
          if (insertError.code === '23505' && insertError.message.includes('leads_mobile_number_unique')) {
            result.duplicates++;
            result.duplicateNumbers.push(lead.mobile_number);
            console.log(`Duplicate phone number: ${lead.mobile_number}`);
          } else {
            result.errors++;
            result.errorDetails.push({
              row: rowNumber,
              error: insertError.message,
            });
            console.error(`Error inserting row ${rowNumber}:`, insertError);
          }
        } else {
          result.imported++;
          console.log(`Imported lead: ${lead.mobile_number}`);
        }
      } catch (error: any) {
        result.errors++;
        result.errorDetails.push({
          row: rowNumber,
          error: error.message,
        });
        console.error(`Error processing row ${rowNumber}:`, error);
      }
    }

    console.log('Import complete:', result);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in import-leads-excel function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
