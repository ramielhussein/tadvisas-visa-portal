-- Create employees table for internal staff
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Basic Info
  employee_id text UNIQUE,
  full_name text NOT NULL,
  nationality_code text,
  date_of_birth date,
  gender text,
  
  -- Contact
  email text,
  phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  
  -- Employment
  hire_date date,
  employment_status text DEFAULT 'Active',
  employment_type text DEFAULT 'Full-Time',
  department text,
  position text,
  reports_to uuid REFERENCES public.employees(id),
  work_location text,
  
  -- Contract
  contract_start_date date,
  contract_end_date date,
  probation_end_date date,
  termination_date date,
  
  -- Salary
  base_salary numeric,
  salary_currency text DEFAULT 'AED',
  payment_frequency text DEFAULT 'Monthly',
  allowances jsonb DEFAULT '[]'::jsonb,
  deductions jsonb DEFAULT '[]'::jsonb,
  last_salary_review_date date,
  next_salary_review_date date,
  
  -- Banking
  bank_name text,
  account_number text,
  iban text,
  swift_code text,
  
  -- Leave
  annual_leave_days integer DEFAULT 30,
  sick_leave_days integer DEFAULT 0,
  leave_balance jsonb DEFAULT '{}'::jsonb,
  
  -- Performance
  performance_rating numeric,
  last_review_date date,
  next_review_date date,
  review_notes text,
  
  -- Documents
  passport_no text,
  passport_expiry_date date,
  emirates_id text,
  photo_url text,
  documents jsonb DEFAULT '[]'::jsonb,
  
  -- System
  created_by uuid,
  notes text
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees
CREATE POLICY "Admins can manage all employees"
  ON public.employees
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "HR can view all employees"
  ON public.employees
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (permissions->'hr'->>'view_employees')::boolean = true
    )
  );

-- Migrate existing staff workers to employees
INSERT INTO public.employees (
  id,
  full_name,
  nationality_code,
  date_of_birth,
  hire_date,
  employment_status,
  department,
  position,
  base_salary,
  salary_currency,
  passport_no,
  passport_expiry_date,
  created_at,
  notes,
  emergency_contact_name,
  emergency_contact_phone,
  emergency_contact_relationship,
  bank_name,
  account_number,
  iban,
  swift_code,
  allowances,
  deductions,
  annual_leave_days,
  sick_leave_days,
  leave_balance,
  contract_start_date,
  contract_end_date,
  probation_end_date,
  termination_date,
  employment_type,
  reports_to,
  work_location,
  last_salary_review_date,
  next_salary_review_date,
  payment_frequency,
  performance_rating,
  last_review_date,
  next_review_date,
  review_notes
)
SELECT 
  id,
  name as full_name,
  nationality_code,
  date_of_birth::date,
  hire_date::date,
  COALESCE(employment_status, 'Active') as employment_status,
  department,
  position,
  base_salary,
  salary_currency,
  passport_no,
  passport_expiry::date as passport_expiry_date,
  created_at,
  NULL as notes,
  emergency_contact_name,
  emergency_contact_phone,
  emergency_contact_relationship,
  bank_name,
  account_number,
  iban,
  swift_code,
  allowances,
  deductions,
  annual_leave_days,
  sick_leave_days,
  leave_balance,
  contract_start_date::date,
  contract_end_date::date,
  probation_end_date::date,
  termination_date::date,
  employment_type,
  reports_to::uuid,
  work_location,
  last_salary_review_date::date,
  next_salary_review_date::date,
  payment_frequency,
  performance_rating,
  last_review_date::date,
  next_review_date::date,
  review_notes
FROM public.workers
WHERE staff = true;

-- Delete staff workers from workers table (they're now in employees)
DELETE FROM public.workers WHERE staff = true;

-- Remove staff-specific HR fields from workers table (keep it focused on domestic workers)
ALTER TABLE public.workers
DROP COLUMN IF EXISTS employee_id,
DROP COLUMN IF EXISTS employment_type,
DROP COLUMN IF EXISTS hire_date,
DROP COLUMN IF EXISTS contract_start_date,
DROP COLUMN IF EXISTS contract_end_date,
DROP COLUMN IF EXISTS probation_end_date,
DROP COLUMN IF EXISTS termination_date,
DROP COLUMN IF EXISTS employment_status,
DROP COLUMN IF EXISTS department,
DROP COLUMN IF EXISTS position,
DROP COLUMN IF EXISTS reports_to,
DROP COLUMN IF EXISTS work_location,
DROP COLUMN IF EXISTS base_salary,
DROP COLUMN IF EXISTS salary_currency,
DROP COLUMN IF EXISTS payment_frequency,
DROP COLUMN IF EXISTS allowances,
DROP COLUMN IF EXISTS deductions,
DROP COLUMN IF EXISTS last_salary_review_date,
DROP COLUMN IF EXISTS next_salary_review_date,
DROP COLUMN IF EXISTS annual_leave_days,
DROP COLUMN IF EXISTS sick_leave_days,
DROP COLUMN IF EXISTS leave_balance,
DROP COLUMN IF EXISTS bank_name,
DROP COLUMN IF EXISTS account_number,
DROP COLUMN IF EXISTS iban,
DROP COLUMN IF EXISTS swift_code,
DROP COLUMN IF EXISTS emergency_contact_name,
DROP COLUMN IF EXISTS emergency_contact_phone,
DROP COLUMN IF EXISTS emergency_contact_relationship,
DROP COLUMN IF EXISTS performance_rating,
DROP COLUMN IF EXISTS last_review_date,
DROP COLUMN IF EXISTS next_review_date,
DROP COLUMN IF EXISTS review_notes;

-- Add trigger for employees updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_employees_nationality ON public.employees(nationality_code);
CREATE INDEX idx_employees_status ON public.employees(employment_status);
CREATE INDEX idx_workers_nationality ON public.workers(nationality_code) WHERE staff = false;