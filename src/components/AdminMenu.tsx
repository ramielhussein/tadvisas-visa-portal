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
import { Shield, FileText, Settings, Users, X, Plus, Images, DollarSign, FileSpreadsheet, MapPin, BarChart3 } from "lucide-react";
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
  }, []);

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isAdmin) return; // Only work if user is admin
      
      // Ctrl+Shift+A to toggle admin menu
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
      // Ctrl+Shift+Q for quick lead entry
      if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
        e.preventDefault();
        console.log('Quick lead entry shortcut triggered');
        setShowQuickEntry(prev => {
          console.log('Setting showQuickEntry to:', !prev);
          return true;
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAdmin]);

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
        <DropdownMenuContent align="start" className="w-56 bg-background border-2 max-h-[80vh] overflow-y-auto">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Admin Controls
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* CRM Section */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">CRM & Leads</DropdownMenuLabel>
          <DropdownMenuItem 
            onClick={() => handleNavigation('/crm/dashboard')}
            className={location.pathname === '/crm/dashboard' ? 'bg-accent' : ''}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            CRM Dashboard
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => handleNavigation('/crm/leads')}
            className={location.pathname === '/crm/leads' ? 'bg-accent' : ''}
          >
            <Shield className="h-4 w-4 mr-2" />
            TADCRM - Leads
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={(e) => {
              e.preventDefault();
              setShowQuickEntry(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Quick Lead Entry (Ctrl+Shift+Q)
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          {/* Forms & Submissions */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">Forms & Submissions</DropdownMenuLabel>
          <DropdownMenuItem 
            onClick={() => handleNavigation('/admin')}
            className={location.pathname === '/admin' ? 'bg-accent' : ''}
          >
            <FileText className="h-4 w-4 mr-2" />
            Client Submissions (Start Here)
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => handleNavigation('/refund')}
            className={location.pathname === '/refund' ? 'bg-accent' : ''}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Refund Calculator
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => handleNavigation('/refundslist')}
            className={location.pathname === '/refundslist' ? 'bg-accent' : ''}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Finalized Refunds
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => handleNavigation('/cvwizard')}
            className={location.pathname === '/cvwizard' ? 'bg-accent' : ''}
          >
            <FileText className="h-4 w-4 mr-2" />
            CV Wizard Form
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* CV Wizard Management */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">CV Wizard</DropdownMenuLabel>
          <DropdownMenuItem 
            onClick={() => handleNavigation('/admin/cvwizard-review')}
            className={location.pathname === '/admin/cvwizard-review' ? 'bg-accent' : ''}
          >
            <Users className="h-4 w-4 mr-2" />
            CV Review & Approval
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => handleNavigation('/admin/cvwizard-settings')}
            className={location.pathname === '/admin/cvwizard-settings' ? 'bg-accent' : ''}
          >
            <Settings className="h-4 w-4 mr-2" />
            CV Wizard Settings
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => handleNavigation('/wizardalbum')}
            className={location.pathname === '/wizardalbum' ? 'bg-accent' : ''}
          >
            <Images className="h-4 w-4 mr-2" />
            Wizard Album (Photos)
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* User Management */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">User Management</DropdownMenuLabel>
          <DropdownMenuItem 
            onClick={() => handleNavigation('/admin/user-management')}
            className={location.pathname === '/admin/user-management' ? 'bg-accent' : ''}
          >
            <Users className="h-4 w-4 mr-2" />
            Create User
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => handleNavigation('/admin/user-list')}
            className={location.pathname === '/admin/user-list' ? 'bg-accent' : ''}
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Users & Permissions
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* System */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">System</DropdownMenuLabel>
          <DropdownMenuItem 
            onClick={() => handleNavigation('/admin/reset-admin')}
            className={location.pathname === '/admin/reset-admin' ? 'bg-accent' : ''}
          >
            <Settings className="h-4 w-4 mr-2" />
            Reset Admin Password
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => handleNavigation('/hub')}
            className={location.pathname === '/hub' ? 'bg-accent' : ''}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Country Albums Hub
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => handleNavigation('/siteguide')}
            className={location.pathname === '/siteguide' ? 'bg-accent' : ''}
          >
            <FileText className="h-4 w-4 mr-2" />
            Site Guide (PDF)
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
