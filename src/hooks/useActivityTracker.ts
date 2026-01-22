import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

/**
 * Hook that tracks user activity and automatically:
 * 1. Checks in users who are active but haven't checked in
 * 
 * Note: Auto break-back is DISABLED. Users must manually click "Break Back"
 * after logging back in from a break.
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

        // Case 2: User is on break - do NOT auto break back
        // They must manually click "Break Back" button after logging in
        if (attendance.status === 'on_break') {
          // Do nothing - user needs to manually end their break
          isProcessing.current = false;
          return;
        }

        // Case 3: User is checked out but active - just notify them
        if (attendance.status === 'checked_out') {
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
  }, [enabled]);
};
