import { useEffect, useState, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  const resolved = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const resolve = (authenticated: boolean) => {
      if (!isMounted || resolved.current) return;
      resolved.current = true;
      setIsAuthenticated(authenticated);
      setLoading(false);
    };

    // Primary: check session once
    supabase.auth.getSession().then(({ data: { session } }) => {
      resolve(!!session);
    }).catch(() => {
      resolve(false);
    });

    // Fallback: listen for auth state change (in case getSession is slow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      // If already resolved, still update auth state for future changes (e.g. logout)
      if (resolved.current) {
        setIsAuthenticated(!!session);
        return;
      }
      resolve(!!session);
    });

    // Safety: never stay loading forever
    const timeout = setTimeout(() => resolve(false), 3000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
