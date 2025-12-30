-- Update is_attendance_manager function to include Ramadan and Abdul for view access
CREATE OR REPLACE FUNCTION public.is_attendance_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = _user_id
      AND (
        LOWER(p.full_name) LIKE '%joseph%'
        OR LOWER(p.full_name) LIKE '%rayaan%'
        OR LOWER(p.full_name) LIKE '%ramin%'
        OR LOWER(p.full_name) LIKE '%rami%'
      )
  )
  OR public.has_role(_user_id, 'super_admin')
$$;

-- Create a new function for view-only attendance access
CREATE OR REPLACE FUNCTION public.can_view_attendance(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- Full attendance managers
    public.is_attendance_manager(_user_id)
    -- Or users with view_team permission
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = _user_id
        AND (p.permissions->'attendance'->>'view_team')::boolean = true
    )
  )
$$;

-- Add RLS policy for users with view_team permission to see attendance records
DROP POLICY IF EXISTS "Users with attendance view permission can view records" ON public.attendance_records;
CREATE POLICY "Users with attendance view permission can view records"
ON public.attendance_records
FOR SELECT
USING (public.can_view_attendance(auth.uid()));