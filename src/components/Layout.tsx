import { ReactNode, useState, useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingButtons from "./FloatingButtons";
import AdminMenu from "./AdminMenu";
import { supabase } from "@/integrations/supabase/client";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className={`min-h-screen flex flex-col ${isAuthenticated ? 'bg-cyan-50' : 'bg-white'}`}>
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      {!isAuthenticated && <FloatingButtons />}
      <AdminMenu />
    </div>
  );
};

export default Layout;
