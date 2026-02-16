import { useEffect, useState } from "react";
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

  useEffect(() => {
    let isMounted = true;

    // Set up listener BEFORE getSession to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      setIsAuthenticated(!!session);
      // Also clear loading on auth state change in case getSession is slow
      if (loading) setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    // Safety timeout - never stay loading forever
    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('[ProtectedRoute] Safety timeout - forcing loading to false');
        setLoading(false);
      }
    }, 3000);

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
    // Store the attempted URL so we can redirect back after login
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
