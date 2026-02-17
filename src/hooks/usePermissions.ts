import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Permissions {
  cv: {
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  refund: {
    create: boolean;
  };
  leads: {
    create: boolean;
    assign: boolean;
  };
  deals: {
    create: boolean;
    edit: boolean;
    delete: boolean;
    view_all: boolean;
  };
  finance: {
    view_dashboard: boolean;
    manage_invoices: boolean;
    manage_transactions: boolean;
  };
  suppliers: {
    create: boolean;
    edit: boolean;
    view_all: boolean;
  };
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) {
        setPermissions(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('permissions')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching permissions:', error);
          setPermissions(null);
          setIsLoading(false);
          return;
        }

        setPermissions((profile?.permissions as unknown) as Permissions || null);
      } catch (error) {
        console.error('Error in checkPermissions:', error);
        setPermissions(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, [user?.id]);

  const hasPermission = (category: keyof Permissions, action: string): boolean => {
    if (!permissions) return false;
    
    const categoryPerms = permissions[category];
    if (!categoryPerms) return false;
    
    return (categoryPerms as any)[action] === true;
  };

  return { permissions, isLoading, user, hasPermission };
};
