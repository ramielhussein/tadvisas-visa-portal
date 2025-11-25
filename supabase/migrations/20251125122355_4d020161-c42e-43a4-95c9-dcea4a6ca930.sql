-- Create function to auto-create employee record for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_employee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create employee record for new user
  INSERT INTO public.employees (
    created_by,
    full_name,
    email,
    employment_status,
    employment_type,
    position,
    department
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.full_name, NEW.email),
    NEW.email,
    'Active',
    'Full-Time',
    'Staff Member',
    'General'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create employee on profile creation
DROP TRIGGER IF EXISTS on_profile_created_employee ON public.profiles;
CREATE TRIGGER on_profile_created_employee
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_employee();

-- Backfill: Create employee records for existing users who don't have one
INSERT INTO public.employees (
  created_by,
  full_name,
  email,
  employment_status,
  employment_type,
  position,
  department
)
SELECT 
  p.id,
  COALESCE(p.full_name, p.email, 'Staff Member'),
  p.email,
  'Active',
  'Full-Time',
  'Staff Member',
  'General'
FROM public.profiles p
LEFT JOIN public.employees e ON e.created_by = p.id
WHERE e.id IS NULL;

-- Also create default shift schedules for all employees without one
INSERT INTO public.employee_shifts (
  employee_id,
  shift_start,
  shift_end,
  break_duration_minutes,
  working_days,
  grace_period_minutes
)
SELECT 
  e.id,
  '09:00:00'::time,
  '18:00:00'::time,
  60,
  ARRAY[1, 2, 3, 4, 5],
  15
FROM public.employees e
LEFT JOIN public.employee_shifts es ON es.employee_id = e.id
WHERE es.id IS NULL;