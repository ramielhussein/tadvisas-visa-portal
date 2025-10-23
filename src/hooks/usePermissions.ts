import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkPermissions();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkPermissions();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkPermissions = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setPermissions(null);
        setIsLoading(false);
        return;
      }

      // Fetch user's profile with permissions
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

  const hasPermission = (category: keyof Permissions, action: string): boolean => {
    if (!permissions) return false;
    
    const categoryPerms = permissions[category];
    if (!categoryPerms) return false;
    
    return (categoryPerms as any)[action] === true;
  };

  return { permissions, isLoading, user, hasPermission };
};
