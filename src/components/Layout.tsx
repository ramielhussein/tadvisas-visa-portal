import { ReactNode, useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import TopHeader from "./TopHeader";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingButtons from "./FloatingButtons";
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

  // Public layout - show old Navbar for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <FloatingButtons />
        <KeyboardShortcutsHelp 
          open={showShortcutsHelp} 
          onClose={() => setShowShortcutsHelp(false)} 
        />
      </div>
    );
  }

  // Authenticated layout - show sidebar for staff users
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-cyan-50">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopHeader />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </div>
      <FloatingButtons />
      <DriversFloatingIsland />
      <KeyboardShortcutsHelp 
        open={showShortcutsHelp} 
        onClose={() => setShowShortcutsHelp(false)} 
      />
    </SidebarProvider>
  );
};

export default Layout;
