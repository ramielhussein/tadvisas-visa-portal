import { ReactNode, useState, useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingButtons from "./FloatingButtons";
import AdminMenu from "./AdminMenu";
import KeyboardShortcutsHelp from "./KeyboardShortcutsHelp";
import DriversFloatingIsland from "./tadgo/DriversFloatingIsland";
import { supabase } from "@/integrations/supabase/client";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

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

  // Global keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for '?' key (Shift + /)
      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setShowShortcutsHelp(true);
        return;
      }
      
      // Check for Ctrl + /
      if (e.ctrlKey && e.key === '/' && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setShowShortcutsHelp(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`min-h-screen flex flex-col ${isAuthenticated ? 'bg-cyan-50' : 'bg-white'}`}>
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <FloatingButtons />
      <AdminMenu />
      <DriversFloatingIsland />
      <KeyboardShortcutsHelp 
        open={showShortcutsHelp} 
        onClose={() => setShowShortcutsHelp(false)} 
      />
    </div>
  );
};

export default Layout;
