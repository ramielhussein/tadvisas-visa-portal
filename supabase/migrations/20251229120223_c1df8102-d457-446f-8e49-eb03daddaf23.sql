-- Create a function to check if user is an attendance manager (Joseph, Rayaan, Ramin)
CREATE OR REPLACE FUNCTION public.is_attendance_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = _user_id
      AND LOWER(p.full_name) IN ('joseph', 'rayaan', 'ramin', 'rami')
  )
  OR public.has_role(_user_id, 'super_admin')
$$;

-- Drop existing restrictive policies and create new ones
DROP POLICY IF EXISTS "Admins can manage attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Admins can view all attendance" ON public.attendance_records;

-- Allow attendance managers to view all attendance records
CREATE POLICY "Attendance managers can view all records"
ON public.attendance_records
FOR SELECT
USING (
  public.is_attendance_manager(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = attendance_records.employee_id 
    AND e.user_id = auth.uid()
  )
);

-- Allow attendance managers to insert attendance records (for marking absent)
CREATE POLICY "Attendance managers can insert records"
ON public.attendance_records
FOR INSERT
WITH CHECK (
  public.is_attendance_manager(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = attendance_records.employee_id 
    AND e.user_id = auth.uid()
  )
);

-- Allow attendance managers to update attendance records
CREATE POLICY "Attendance managers can update records"
ON public.attendance_records
FOR UPDATE
USING (
  public.is_attendance_manager(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = attendance_records.employee_id 
    AND e.user_id = auth.uid()
  )
);

-- Allow attendance managers to delete attendance records
CREATE POLICY "Attendance managers can delete records"
ON public.attendance_records
FOR DELETE
USING (public.is_attendance_manager(auth.uid()));