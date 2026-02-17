import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

/**
 * Custom hook for attendance tracking
 * Auto check-in is ENABLED on login since users are auto-logged out at 8:30 PM
 */
export const useAutoAttendance = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      handleAutoCheckIn(user.id);
    }
  }, [user?.id]);
};

async function handleAutoCheckIn(userId: string) {
  try {
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!employee) return;

    const today = format(new Date(), 'yyyy-MM-dd');

    const { data: existing } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('employee_id', employee.id)
      .eq('attendance_date', today)
      .maybeSingle();

    if (existing) return;

    const now = new Date();
    const uaeHour = now.getUTCHours() + 4;

    if (uaeHour >= 20.5) return;

    const isLate = uaeHour >= 11;
    const lateMinutes = isLate ? Math.floor((uaeHour - 10) * 60 + now.getUTCMinutes()) : 0;

    await supabase
      .from('attendance_records')
      .insert({
        employee_id: employee.id,
        attendance_date: today,
        check_in_time: now.toISOString(),
        status: 'checked_in',
        is_late: isLate,
        late_minutes: isLate ? lateMinutes : 0,
      });

    console.log('Auto check-in completed for today');
  } catch (error) {
    console.error('Auto check-in error:', error);
  }
}
