import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./NotificationBell";
import QuickLeadEntry from "./crm/QuickLeadEntry";
import { LogOut, Plus, Menu, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TopHeader = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const { isAdmin, isSuperAdmin, isSales } = useUserRole();
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
    navigate("/");
  };

  const handleAddLead = () => {
    setShowQuickEntry(true);
  };

  const handleQuickEntrySuccess = () => {
    setShowQuickEntry(false);
    toast({
      title: "Lead Added",
      description: "New lead has been added successfully.",
    });
  };

  const handleWhatsAppClick = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': 'AW-17062228159/LnZKCNbb0cwZEL-tyts_',
        'value': 1.0,
        'currency': 'AED',
      });
    }
    window.open("https://wa.me/971568830507", "_blank");
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-background border-b h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="h-8 w-8">
            <Menu className="h-4 w-4" />
          </SidebarTrigger>
        </div>

        <div className="flex items-center gap-2">
          {!user && (
            <Button
              variant="default"
              size="sm"
              onClick={handleWhatsAppClick}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Phone className="h-4 w-4 mr-1" />
              WhatsApp
            </Button>
          )}

          {user && (isSales || isAdmin || isSuperAdmin) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddLead}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Lead</span>
            </Button>
          )}

          {user && <NotificationBell />}

          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/auth")}
            >
              Staff Login
            </Button>
          )}
        </div>
      </header>

      <QuickLeadEntry
        open={showQuickEntry}
        onClose={() => setShowQuickEntry(false)}
        onSuccess={handleQuickEntrySuccess}
      />
    </>
  );
};

export default TopHeader;
