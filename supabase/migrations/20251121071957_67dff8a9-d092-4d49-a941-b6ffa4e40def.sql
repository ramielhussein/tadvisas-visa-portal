-- Add HR-ready fields to workers table for both staff and workers

-- Employment & Contract Information
ALTER TABLE public.workers 
ADD COLUMN IF NOT EXISTS employee_id text UNIQUE,
ADD COLUMN IF NOT EXISTS employment_type text CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'temporary')),
ADD COLUMN IF NOT EXISTS hire_date date,
ADD COLUMN IF NOT EXISTS contract_start_date date,
ADD COLUMN IF NOT EXISTS contract_end_date date,
ADD COLUMN IF NOT EXISTS probation_end_date date,
ADD COLUMN IF NOT EXISTS termination_date date,
ADD COLUMN IF NOT EXISTS employment_status text DEFAULT 'active' CHECK (employment_status IN ('active', 'on-leave', 'suspended', 'terminated', 'resigned'));

-- Department & Position
ALTER TABLE public.workers
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS position text,
ADD COLUMN IF NOT EXISTS reports_to uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS work_location text;

-- Salary Information (enhanced)
ALTER TABLE public.workers
ADD COLUMN IF NOT EXISTS base_salary numeric,
ADD COLUMN IF NOT EXISTS salary_currency text DEFAULT 'AED',
ADD COLUMN IF NOT EXISTS payment_frequency text DEFAULT 'monthly' CHECK (payment_frequency IN ('daily', 'weekly', 'bi-weekly', 'monthly', 'annual')),
ADD COLUMN IF NOT EXISTS last_salary_review_date date,
ADD COLUMN IF NOT EXISTS next_salary_review_date date,
ADD COLUMN IF NOT EXISTS allowances jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS deductions jsonb DEFAULT '[]'::jsonb;

-- Leave & Benefits
ALTER TABLE public.workers
ADD COLUMN IF NOT EXISTS annual_leave_days numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sick_leave_days numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS leave_balance jsonb DEFAULT '{"annual": 0, "sick": 0, "unpaid": 0}'::jsonb;

-- Banking Information (for salary payments)
ALTER TABLE public.workers
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS account_number text,
ADD COLUMN IF NOT EXISTS iban text,
ADD COLUMN IF NOT EXISTS swift_code text;

-- Emergency Contact
ALTER TABLE public.workers
ADD COLUMN IF NOT EXISTS emergency_contact_name text,
ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
ADD COLUMN IF NOT EXISTS emergency_contact_relationship text;

-- Performance & Reviews
ALTER TABLE public.workers
ADD COLUMN IF NOT EXISTS performance_rating numeric CHECK (performance_rating >= 1 AND performance_rating <= 5),
ADD COLUMN IF NOT EXISTS last_review_date date,
ADD COLUMN IF NOT EXISTS next_review_date date,
ADD COLUMN IF NOT EXISTS review_notes text;

-- Comments
COMMENT ON COLUMN public.workers.employee_id IS 'Unique employee/staff identifier for HR systems';
COMMENT ON COLUMN public.workers.employment_type IS 'Type of employment contract';
COMMENT ON COLUMN public.workers.employment_status IS 'Current employment status';
COMMENT ON COLUMN public.workers.department IS 'Department or team the worker/staff belongs to';
COMMENT ON COLUMN public.workers.position IS 'Job title or position';
COMMENT ON COLUMN public.workers.reports_to IS 'Manager or supervisor user ID';
COMMENT ON COLUMN public.workers.allowances IS 'JSON array of salary allowances (housing, transport, etc.)';
COMMENT ON COLUMN public.workers.deductions IS 'JSON array of salary deductions';
COMMENT ON COLUMN public.workers.leave_balance IS 'Current leave balance by type';

-- Create index for employee_id lookups
CREATE INDEX IF NOT EXISTS idx_workers_employee_id ON public.workers(employee_id);
CREATE INDEX IF NOT EXISTS idx_workers_department ON public.workers(department);
CREATE INDEX IF NOT EXISTS idx_workers_employment_status ON public.workers(employment_status);
CREATE INDEX IF NOT EXISTS idx_workers_hire_date ON public.workers(hire_date);