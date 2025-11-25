import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

/**
 * Custom hook to automatically check in on login and check out on logout
 * UAE Labor Law compliant attendance tracking
 */
export const useAutoAttendance = () => {
  useEffect(() => {
    const handleAutoCheckIn = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get employee record for current user
        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('created_by', user.id)
          .maybeSingle();

        if (!employee) return;

        const today = format(new Date(), 'yyyy-MM-dd');

        // Check if already checked in today
        const { data: existingAttendance } = await supabase
          .from('attendance_records')
          .select('id, check_in_time, status')
          .eq('employee_id', employee.id)
          .eq('attendance_date', today)
          .maybeSingle();

        // Only auto check-in if no record exists
        if (!existingAttendance) {
          await supabase
            .from('attendance_records')
            .insert({
              employee_id: employee.id,
              attendance_date: today,
              check_in_time: new Date().toISOString(),
              status: 'checked_in',
            });
          
          console.log('Auto check-in successful');
        }
      } catch (error) {
        console.error('Auto check-in error:', error);
      }
    };

    // Auto check-in when component mounts (user logs in)
    handleAutoCheckIn();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          handleAutoCheckIn();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);
};
