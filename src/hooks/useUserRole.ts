import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'super_admin' | 'admin' | 'sales_manager' | 'sales' | 'finance' | 'product' | 'client' | 'user' | null;

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    checkUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      // Check user's highest priority role
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking user role:', error);
        setRole('user');
        setIsLoading(false);
        return;
      }

      // Priority order: super_admin > admin > finance > sales_manager > sales > product > client > user
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
      console.error('Error in checkUserRole:', error);
      setRole('user');
    } finally {
      setIsLoading(false);
    }
  };

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
