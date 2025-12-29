-- Fix the is_attendance_manager function to match full names containing joseph, rayaan, ramin, rami
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
      AND (
        LOWER(p.full_name) LIKE '%joseph%'
        OR LOWER(p.full_name) LIKE '%rayaan%'
        OR LOWER(p.full_name) LIKE '%ramin%'
        OR LOWER(p.full_name) LIKE '%rami%'
      )
  )
  OR public.has_role(_user_id, 'super_admin')
$$;