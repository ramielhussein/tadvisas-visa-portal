import { FileText, Users, MessageSquare, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import TeamChat from "./TeamChat";
import QuickLeadEntry from "./crm/QuickLeadEntry";

const FloatingButtons = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleMaidVisaClick = () => {
    if ((window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': 'AW-17128942210'
      });
    }
    const phoneNumber = "971567222248";
    const message = "Hi, I need help with maid visa services";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleHireMaidClick = () => {
    if ((window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': 'AW-17128942210'
      });
    }
    const phoneNumber = "971565822258";
    const message = "Hi, I need help hiring a maid";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleChatOpen = () => {
    setIsChatOpen(true);
    setIsChatMinimized(false);
    setUnreadCount(0);
  };

  // Show authenticated buttons when logged in
  if (isAuthenticated) {
    return (
      <>
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[60] flex flex-nowrap gap-3 whitespace-nowrap">
          <button
            onClick={handleChatOpen}
            className="group shrink-0 flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 md:px-5 md:py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all transform hover:scale-105 whitespace-nowrap relative"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs font-semibold">Team Chat</span>
            {unreadCount > 0 && !isChatOpen && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setIsAddLeadOpen(true)}
            className="group shrink-0 flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-2 md:px-5 md:py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-secondary/80 transition-all transform hover:scale-105 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span className="text-xs font-semibold">Add Lead</span>
          </button>
        </div>
        
        <TeamChat 
          isOpen={isChatOpen}
          isMinimized={isChatMinimized}
          onClose={() => setIsChatOpen(false)}
          onMinimize={() => setIsChatMinimized(true)}
          onExpand={() => setIsChatMinimized(false)}
          unreadCount={unreadCount}
        />
        
        <QuickLeadEntry 
          open={isAddLeadOpen}
          onClose={() => setIsAddLeadOpen(false)}
          onSuccess={() => {
            setIsAddLeadOpen(false);
            navigate('/crm');
          }}
        />
      </>
    );
  }

  // Show public WhatsApp buttons when not logged in
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[60] flex flex-nowrap gap-3 whitespace-nowrap">
      <button
        onClick={handleMaidVisaClick}
        className="group shrink-0 flex items-center gap-2 bg-white backdrop-blur-sm border border-[#c9a227]/30 text-[#c9a227] px-3 py-2 md:px-5 md:py-3 rounded-none md:rounded-full shadow-lg hover:shadow-xl hover:bg-[#c9a227]/10 transition-all transform hover:scale-105 whitespace-nowrap"
      >
        <FileText className="w-4 h-4" />
        <span className="text-xs font-semibold">Apply for a Maid Visa</span>
      </button>
      <button
        onClick={handleHireMaidClick}
        className="group shrink-0 flex items-center gap-2 bg-white backdrop-blur-sm border border-[#0f73bd]/30 text-[#0f73bd] px-3 py-2 md:px-5 md:py-3 rounded-none md:rounded-full shadow-lg hover:shadow-xl hover:bg-[#0f73bd]/10 transition-all transform hover:scale-105 whitespace-nowrap"
      >
        <Users className="w-4 h-4" />
        <span className="text-xs font-semibold">Hire a Maid</span>
      </button>
    </div>
  );
};

export default FloatingButtons;