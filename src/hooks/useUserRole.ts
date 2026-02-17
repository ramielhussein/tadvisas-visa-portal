import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = 'super_admin' | 'admin' | 'sales_manager' | 'sales' | 'finance' | 'product' | 'client' | 'user' | null;

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const loadRole = async (userId: string) => {
      try {
        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        if (!isMounted) return;

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking user role:', error);
          setRole('user');
          return;
        }

        if (roles && roles.length > 0) {
          const userRoles = roles.map(r => r.role);
          const hasSuperAdmin = userRoles.includes('super_admin');
          setIsSuperAdmin(hasSuperAdmin);
          
          if (hasSuperAdmin) setRole('super_admin');
          else if (userRoles.includes('admin')) setRole('admin');
          else if (userRoles.includes('finance')) setRole('finance');
          else if (userRoles.includes('sales_manager')) setRole('sales_manager');
          else if (userRoles.includes('sales')) setRole('sales');
          else if (userRoles.includes('product')) setRole('product');
          else if (userRoles.includes('client')) setRole('client');
          else setRole('user');
        } else {
          setRole('user');
        }
      } catch (error) {
        console.error('Error in loadRole:', error);
        if (isMounted) setRole('user');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (user) {
      loadRole(user.id);
    } else {
      setRole(null);
      setIsSuperAdmin(false);
      setIsLoading(false);
    }

    return () => { isMounted = false; };
  }, [user?.id]);

  const hasRole = (checkRole: UserRole) => {
    return role === checkRole;
  };

  const isAdmin = role === 'admin' || role === 'super_admin';
  const isSales = role === 'sales' || role === 'sales_manager' || isAdmin;
  const isFinance = role === 'finance' || isAdmin;
  const isProduct = role === 'product' || isAdmin;
  const isClient = role === 'client';

  return { 
    role, 
    isLoading, 
    user,
    hasRole,
    isAdmin,
    isSuperAdmin,
    isSales,
    isFinance,
    isProduct,
    isClient
  };
};
