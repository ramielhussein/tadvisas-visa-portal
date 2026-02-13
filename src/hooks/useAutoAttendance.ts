import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

/**
 * Custom hook for attendance tracking
 * Auto check-in is ENABLED on login since users are auto-logged out at 8:30 PM
 * This prevents accidental check-ins from sleep since sessions don't persist overnight
 */
export const useAutoAttendance = () => {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await handleAutoCheckIn(session.user.id);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);
};

async function handleAutoCheckIn(userId: string) {
  try {
    // Get employee record
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!employee) return;

    const today = format(new Date(), 'yyyy-MM-dd');

    // Check if there's already an attendance record for today
    const { data: existing } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('employee_id', employee.id)
      .eq('attendance_date', today)
      .maybeSingle();

    // Only auto check-in if no record exists for today
    if (existing) return;

    const now = new Date();
    const uaeHour = now.getUTCHours() + 4; // UAE is UTC+4

    // Only auto check-in during working hours (before 8:30 PM UAE = 20:30)
    if (uaeHour >= 20.5) return;

    // Determine if late (after 11:00 AM UAE)
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
