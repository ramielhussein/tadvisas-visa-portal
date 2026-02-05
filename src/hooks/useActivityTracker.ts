import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

/**
 * Hook that tracks user activity and automatically ends breaks
 * when users log back in after being on break.
 * 
 * AUTO CHECK-IN IS DISABLED - users must manually check in.
 * AUTO CHECKOUT IS DISABLED - users must manually check out.
 * 
 * This hook ONLY handles:
 * - Auto break-back when user is on_break and becomes active
 */
export const useActivityTracker = (enabled: boolean = true) => {
  const lastActivityCheck = useRef<number>(0);
  const isProcessing = useRef(false);
  const hasCheckedOnMount = useRef(false);
  const DEBOUNCE_MS = 60000; // Only check every 60 seconds max

  useEffect(() => {
    if (!enabled) return;

    // Only run once on mount to handle break-back scenario
    const handleBreakBack = async () => {
      if (hasCheckedOnMount.current) return;
      isProcessing.current = true;
      hasCheckedOnMount.current = true;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          isProcessing.current = false;
          return;
        }

        // Get employee record
        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!employee) {
          isProcessing.current = false;
          return;
        }

        const today = format(new Date(), 'yyyy-MM-dd');

        // Check attendance record for today
        const { data: attendance } = await supabase
          .from('attendance_records')
          .select('id, status')
          .eq('employee_id', employee.id)
          .eq('attendance_date', today)
          .maybeSingle();

        // No attendance record - do nothing, user must manually check in
        if (!attendance) return;

        // User is on break but logged back in - auto break back
        // This is the ONLY automatic action we perform
        if (attendance.status === 'on_break') {
          const { data: openBreak } = await supabase
            .from('break_records')
            .select('id, break_out_time')
            .eq('attendance_record_id', attendance.id)
            .is('break_back_time', null)
            .order('break_out_time', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { data: currentAttendance } = await supabase
            .from('attendance_records')
            .select('total_break_minutes')
            .eq('id', attendance.id)
            .single();

          let totalBreakMinutes = currentAttendance?.total_break_minutes || 0;

          if (openBreak) {
            const breakBackTime = new Date().toISOString();
            const breakDuration = Math.floor(
              (new Date(breakBackTime).getTime() - new Date(openBreak.break_out_time).getTime()) / 60000
            );

            await supabase
              .from('break_records')
              .update({
                break_back_time: breakBackTime,
                break_duration_minutes: breakDuration,
              })
              .eq('id', openBreak.id);

            const { data: allBreaks } = await supabase
              .from('break_records')
              .select('break_duration_minutes')
              .eq('attendance_record_id', attendance.id)
              .not('break_duration_minutes', 'is', null);

            totalBreakMinutes = (allBreaks || []).reduce(
              (sum, b) => sum + (b.break_duration_minutes || 0),
              0
            );
          }

          await supabase
            .from('attendance_records')
            .update({
              status: 'checked_in',
              total_break_minutes: totalBreakMinutes,
            })
            .eq('id', attendance.id);
        }

      } catch (error) {
        console.error('Activity tracker error:', error);
      } finally {
        isProcessing.current = false;
      }
    };

    // Run once on mount
    handleBreakBack();

    return () => {};
  }, [enabled]);
};
