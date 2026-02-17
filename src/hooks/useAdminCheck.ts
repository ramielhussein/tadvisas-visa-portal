import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useAdminCheck = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const checkRoles = async (userId: string) => {
      try {
        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .in('role', ['admin', 'super_admin']);

        if (!isMounted) return;

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          return;
        }

        const userRoles = roles?.map(r => r.role) || [];
        const hasSuperAdmin = userRoles.includes('super_admin');
        const hasAdmin = userRoles.includes('admin');
        setIsSuperAdmin(hasSuperAdmin);
        setIsAdmin(hasAdmin || hasSuperAdmin);
      } catch (error) {
        console.error('Error in checkAdminStatus:', error);
        if (isMounted) { setIsAdmin(false); setIsSuperAdmin(false); }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (user) {
      checkRoles(user.id);
    } else {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setIsLoading(false);
    }

    return () => { isMounted = false; };
  }, [user?.id]);

  return { isAdmin, isSuperAdmin, isLoading, user };
};
