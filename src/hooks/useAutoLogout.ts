import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Auto-logs out users at 8:30 PM UAE time (UTC+4 = 16:30 UTC).
 * Checks every 60 seconds if the current UAE time has passed 20:30.
 */
export const useAutoLogout = (enabled: boolean = true) => {
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const checkTime = async () => {
      if (hasLoggedOut.current) return;

      const now = new Date();
      const uaeHours = (now.getUTCHours() + 4) % 24;
      const uaeMinutes = now.getUTCMinutes();

      // 8:30 PM UAE = 20:30
      if (uaeHours > 20 || (uaeHours === 20 && uaeMinutes >= 30)) {
        hasLoggedOut.current = true;
        toast.info('Auto logout: Working hours ended (8:30 PM). See you tomorrow!');
        await supabase.auth.signOut();
      }
    };

    // Check immediately and then every 60 seconds
    checkTime();
    const interval = setInterval(checkTime, 60000);

    return () => clearInterval(interval);
  }, [enabled]);
};
