import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

/**
 * Hook that tracks user activity and automatically:
 * 1. Checks in users who are active but haven't checked in
 * 2. Ends breaks for users who are on break but active in the system
 * 
 * Debounced to avoid excessive database calls
 */
export const useActivityTracker = (enabled: boolean = true) => {
  const lastActivityCheck = useRef<number>(0);
  const isProcessing = useRef(false);
  const DEBOUNCE_MS = 30000; // Only check every 30 seconds max

  useEffect(() => {
    // Skip if not enabled (user not authenticated)
    if (!enabled) return;
    const handleActivity = async () => {
      const now = Date.now();
      
      // Debounce: don't check more than once per 30 seconds
      if (now - lastActivityCheck.current < DEBOUNCE_MS) return;
      if (isProcessing.current) return;
      
      lastActivityCheck.current = now;
      isProcessing.current = true;

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

        // Check if user has an attendance record for today
        const { data: attendance } = await supabase
          .from('attendance_records')
          .select('id, status')
          .eq('employee_id', employee.id)
          .eq('attendance_date', today)
          .maybeSingle();

        // Case 1: No attendance record - auto check-in
        if (!attendance) {
          const { error } = await supabase
            .from('attendance_records')
            .insert({
              employee_id: employee.id,
              attendance_date: today,
              check_in_time: new Date().toISOString(),
              status: 'checked_in',
            });

          if (!error) {
            toast.info('Auto check-in: You were not checked in but are active');
          }
          isProcessing.current = false;
          return;
        }

        // Case 2: User is on break but active - auto break back
        if (attendance.status === 'on_break') {
          // Find the open break record
          const { data: openBreak } = await supabase
            .from('break_records')
            .select('id, break_out_time')
            .eq('attendance_record_id', attendance.id)
            .is('break_back_time', null)
            .order('break_out_time', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (openBreak) {
            const breakBackTime = new Date().toISOString();
            const breakDuration = Math.floor(
              (new Date(breakBackTime).getTime() - new Date(openBreak.break_out_time).getTime()) / 60000
            );

            // Update break record
            await supabase
              .from('break_records')
              .update({
                break_back_time: breakBackTime,
                break_duration_minutes: breakDuration,
              })
              .eq('id', openBreak.id);

            // Recalculate total break minutes
            const { data: allBreaks } = await supabase
              .from('break_records')
              .select('break_duration_minutes')
              .eq('attendance_record_id', attendance.id)
              .not('break_duration_minutes', 'is', null);

            const totalBreakMinutes = (allBreaks || []).reduce(
              (sum, b) => sum + (b.break_duration_minutes || 0),
              0
            );

            // Update attendance status
            await supabase
              .from('attendance_records')
              .update({
                status: 'checked_in',
                total_break_minutes: totalBreakMinutes,
              })
              .eq('id', attendance.id);

            toast.info('Auto break-back: You were on break but are now active');
          }
        }

        // Case 3: User is checked out but active - auto check-in (re-check-in)
        if (attendance.status === 'checked_out') {
          // Create a new attendance record for the same day (or update existing)
          // For simplicity, we'll just notify the user - they can manually handle this
          toast.warning('You checked out earlier but are still active. Consider checking in again if needed.');
        }
      } catch (error) {
        console.error('Activity tracker error:', error);
      } finally {
        isProcessing.current = false;
      }
    };

    // Listen to various activity events
    const events = ['click', 'keydown', 'scroll', 'mousemove'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Also run on route changes (via popstate)
    window.addEventListener('popstate', handleActivity);

    // Check on mount
    handleActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      window.removeEventListener('popstate', handleActivity);
    };
  }, []);
};
