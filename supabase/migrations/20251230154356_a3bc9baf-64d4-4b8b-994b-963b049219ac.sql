
-- Allow users with attendance.view_team permission to view employees for attendance display
CREATE POLICY "Users with attendance view can see employees"
ON public.employees
FOR SELECT
USING (
  public.can_view_attendance(auth.uid())
);
