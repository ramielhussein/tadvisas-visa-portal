-- Allow employees to view their own employee record using user_id
CREATE POLICY "Employees can view their own record"
ON public.employees
FOR SELECT
USING (user_id = auth.uid());

-- Update attendance_records policies to use employees.user_id instead of created_by
ALTER POLICY "Employees can update their attendance"
ON public.attendance_records
USING (
  employee_id IN (
    SELECT e.id FROM public.employees e WHERE e.user_id = auth.uid()
  )
);

ALTER POLICY "Employees can view their attendance"
ON public.attendance_records
USING (
  employee_id IN (
    SELECT e.id FROM public.employees e WHERE e.user_id = auth.uid()
  )
);

-- Update break_records policy to use employees.user_id linkage
ALTER POLICY "Employees can manage their breaks"
ON public.break_records
USING (
  attendance_record_id IN (
    SELECT ar.id
    FROM public.attendance_records ar
    JOIN public.employees e ON e.id = ar.employee_id
    WHERE e.user_id = auth.uid()
  )
);

-- Update employee_shifts policy to use employees.user_id linkage
ALTER POLICY "Employees can view their own shift"
ON public.employee_shifts
USING (
  employee_id IN (
    SELECT e.id FROM public.employees e WHERE e.user_id = auth.uid()
  )
);