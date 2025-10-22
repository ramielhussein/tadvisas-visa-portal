import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Shield, FileText, Settings, Users, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QuickLeadEntry from "@/components/crm/QuickLeadEntry";

const AdminMenu = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminStatus();
    
    // Keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+Shift+A to toggle admin menu
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
      // Ctrl+Shift+Q for quick lead entry
      if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
        e.preventDefault();
        setShowQuickEntry(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (!user) {
        setIsAdmin(false);
        return;
      }

      // Check if user has admin role
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(!!roles);
    } catch (error) {
      console.error('Error in checkAdminStatus:', error);
      setIsAdmin(false);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    toast({
      title: "Navigating",
      description: `Opening ${path.split('/').pop()}`,
    });
  };

  // Don't render anything if user is not admin
  if (!isAdmin || !user) {
    return null;
  }

  // Show admin menu indicator (always visible for admins)
  if (!isVisible) {
    return (
      <div 
        className="fixed bottom-4 left-4 z-50 cursor-pointer"
        onClick={() => setIsVisible(true)}
      >
        <div className="relative group">
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 rounded-full border-2 border-primary/20 bg-background/80 backdrop-blur-sm hover:border-primary shadow-lg"
          >
            <Shield className="h-4 w-4 text-primary" />
          </Button>
          <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Admin Menu (Ctrl+Shift+A)
          </div>
        </div>
      </div>
    );
  }

  // Full admin menu
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <DropdownMenu open={isVisible} onOpenChange={setIsVisible}>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="default"
            className="h-10 px-3 rounded-full shadow-lg"
          >
            <Shield className="h-4 w-4 mr-2" />
            Admin Menu
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 bg-background border-2">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Admin Controls
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => handleNavigation('/admin')}
            className={location.pathname === '/admin' ? 'bg-accent' : ''}
          >
            <FileText className="h-4 w-4 mr-2" />
            Client Request Submissions
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => handleNavigation('/crm/leads')}
            className={location.pathname === '/crm/leads' ? 'bg-accent' : ''}
          >
            <Shield className="h-4 w-4 mr-2" />
            TADCRM - Leads
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => setShowQuickEntry(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Quick Lead Entry (Ctrl+Shift+Q)
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => handleNavigation('/admin/cvwizard-review')}
            className={location.pathname === '/admin/cvwizard-review' ? 'bg-accent' : ''}
          >
            <Users className="h-4 w-4 mr-2" />
            CV Wizard Review
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => handleNavigation('/admin/cvwizard-settings')}
            className={location.pathname === '/admin/cvwizard-settings' ? 'bg-accent' : ''}
          >
            <Settings className="h-4 w-4 mr-2" />
            CV Wizard Settings
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => handleNavigation('/admin/create-user')}
            className={location.pathname === '/admin/create-user' ? 'bg-accent' : ''}
          >
            <Users className="h-4 w-4 mr-2" />
            Create User
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setIsVisible(false)}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Hide Menu
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <div className="text-xs text-muted-foreground mt-2 text-center">
        Press Ctrl+Shift+A
      </div>

      <QuickLeadEntry
        open={showQuickEntry}
        onClose={() => setShowQuickEntry(false)}
        onSuccess={() => {
          toast({
            title: "Success",
            description: "Lead added successfully",
          });
        }}
      />
    </div>
  );
};

export default AdminMenu;
