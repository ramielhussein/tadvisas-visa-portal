import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContractRow {
  name: string;
  nationality: string;
  employer_name: string;
  date_of_join: string;
  amount: number;
  employer_email: string;
  employer_phone: string;
}

interface ImportResult {
  workersCreated: number;
  contractsCreated: number;
  employeesCreated: number;
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roles || roles.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new Error('No file uploaded');
    }

    const text = await file.text();
    const rows = parseCSV(text);

    const result: ImportResult = {
      workersCreated: 0,
      contractsCreated: 0,
      employeesCreated: 0,
      errors: [],
    };

    // Get or create default product for monthly contracts
    let { data: monthlyProduct } = await supabase
      .from('products')
      .select('id')
      .eq('code', 'MONTHLY')
      .single();

    if (!monthlyProduct) {
      const { data: newProduct } = await supabase
        .from('products')
        .insert({
          code: 'MONTHLY',
          name: 'Monthly Contract',
          product_type: 'service',
          is_monthly: true,
          is_active: true,
        })
        .select('id')
        .single();
      monthlyProduct = newProduct;
    }

    // Get admin user as default salesman
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        const isTadmaidsStaff = row.employer_name?.toLowerCase().includes('tadmaids') || row.amount === 0;

        if (isTadmaidsStaff) {
          // Create employee record
          const { error: empError } = await supabase
            .from('employees')
            .insert({
              full_name: row.name,
              nationality_code: getNationalityCode(row.nationality),
              hire_date: parseDate(row.date_of_join),
              base_salary: 0,
              employment_status: 'Active',
              employment_type: 'Full-Time',
              position: 'Staff',
              created_by: user.id,
            });

          if (empError) {
            result.errors.push(`Row ${i + 2}: ${empError.message}`);
          } else {
            result.employeesCreated++;
          }
        } else {
          // Create worker record
          const { data: worker, error: workerError } = await supabase
            .from('workers')
            .insert({
              full_name: row.name,
              nationality_code: getNationalityCode(row.nationality),
              status: 'With Client',
              created_by: user.id,
            })
            .select('id')
            .single();

          if (workerError) {
            result.errors.push(`Row ${i + 2}: ${workerError.message}`);
            continue;
          }

          result.workersCreated++;

          // Create contract record
          const contractDate = parseDate(row.date_of_join);
          const startDate = new Date(contractDate);
          const endDate = new Date(startDate);
          endDate.setFullYear(endDate.getFullYear() + 2);

          const baseAmount = row.amount || 0;
          const vatAmount = baseAmount * 0.05;
          const totalAmount = baseAmount + vatAmount;
          const monthlyAmount = totalAmount / 24;

          const { error: contractError } = await supabase
            .from('contracts')
            .insert({
              worker_id: worker!.id,
              product_id: monthlyProduct!.id,
              salesman_id: adminProfile!.id,
              client_name: row.employer_name,
              client_phone: row.employer_phone || '',
              client_email: row.employer_email || null,
              contract_date: contractDate,
              start_date: contractDate,
              end_date: endDate.toISOString().split('T')[0],
              duration_months: 24,
              base_amount: baseAmount,
              vat_rate: 5,
              vat_amount: vatAmount,
              total_amount: totalAmount,
              monthly_amount: monthlyAmount,
              status: 'Active',
              created_by: user.id,
            });

          if (contractError) {
            result.errors.push(`Row ${i + 2} Contract: ${contractError.message}`);
          } else {
            result.contractsCreated++;
          }
        }
      } catch (error) {
        result.errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseCSV(text: string): ContractRow[] {
  const lines = text.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  
  const rows: ContractRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    
    rows.push({
      name: row.name || '',
      nationality: row.nationality || '',
      employer_name: row.employer_name || '',
      date_of_join: row.date_of_join || row.date_of_join_or_contract || '',
      amount: parseFloat(row.amount) || 0,
      employer_email: row.employer_email || '',
      employer_phone: row.employer_phone || row.employer_phone_number || '',
    });
  }
  
  return rows;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current);
  return values;
}

function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  // Try parsing different date formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return new Date().toISOString().split('T')[0];
}

function getNationalityCode(nationality: string): string {
  const mapping: { [key: string]: string } = {
    'filipino': 'PH',
    'philippines': 'PH',
    'indian': 'ID',
    'india': 'ID',
    'ethiopian': 'ET',
    'ethiopia': 'ET',
    'kenyan': 'AF',
    'kenya': 'AF',
    'ugandan': 'AF',
    'uganda': 'AF',
    'bangladeshi': 'ID',
    'bangladesh': 'ID',
    'sri lankan': 'ID',
    'sri lanka': 'ID',
    'nepali': 'ID',
    'nepal': 'ID',
    'myanmar': 'MY',
    'burmese': 'MY',
  };
  
  const normalized = nationality.toLowerCase().trim();
  return mapping[normalized] || 'ID';
}
