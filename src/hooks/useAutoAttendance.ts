import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Custom hook for attendance tracking
 * Auto check-in is DISABLED - users must manually check in
 * Only handles auto check-out on logout
 */
export const useAutoAttendance = () => {
  useEffect(() => {
    // Listen for auth state changes - only handle SIGN OUT for auto check-out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Auto check-in is DISABLED
        // Users must manually click "Check In" button
        // This prevents accidental check-ins when laptop wakes from sleep
        
        if (event === 'SIGNED_OUT') {
          // Optionally handle auto check-out on logout
          console.log('User signed out - check-out should be done manually');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);
};
