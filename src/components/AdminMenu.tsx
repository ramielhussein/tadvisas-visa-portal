import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Shield, FileText, Settings, Users, X, Plus, Images, DollarSign, FileSpreadsheet, MapPin, BarChart3, Briefcase, Coins, Building2, LogOut, ArrowLeftRight, TrendingUp, Package } from "lucide-react";
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
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

  // Full admin menu - card-based structure
  const sections = [
    {
      title: "Product Management",
      items: [
        { title: "Create Worker CV", path: "/cvwizard", icon: FileText },
        { title: "Product Dashboard", path: "/product/dashboard", icon: Package },
        { title: "Purchase Orders", path: "/product/purchase-orders", icon: FileText },
        { title: "Daily Headcount", path: "/product/daily-headcount", icon: Users },
      ],
    },
    {
      title: "CRM & Sales",
      items: [
        { title: "CRM Dashboard", path: "/crm/dashboard", icon: BarChart3 },
        { title: "Lead Management", path: "/crm/leads", icon: Shield },
        { title: "Quick Lead Entry", action: "quick-lead", icon: Plus },
        { title: "Lead Sources", path: "/crm/lead-sources", icon: Settings },
        { title: "Inquiry Packages", path: "/crm/inquiry-packages", icon: Package },
        { title: "Sales Packages", path: "/crm/sales-packages", icon: Package },
        { title: "Deals & Sales", path: "/deals", icon: Briefcase },
      ],
    },
    {
      title: "Finance & Accounting",
      items: [
        { title: "Financial Dashboard", path: "/financial", icon: Coins },
        { title: "Payments List", path: "/payments", icon: DollarSign },
        { title: "Expenses", path: "/expenses", icon: DollarSign },
        { title: "Suppliers & A/P", path: "/product/suppliers", icon: Building2 },
        { title: "Bank Accounts", path: "/bank-accounts", icon: DollarSign },
        { title: "Owner's Equity", path: "/owner-equity", icon: TrendingUp },
        { title: "Contracts", path: "/contracts", icon: FileText },
        { title: "Refunds", path: "/refunds-approval", icon: ArrowLeftRight },
      ],
    },
    {
      title: "Forms & Submissions",
      items: [
        { title: "Client Submissions", path: "/client-submissions", icon: FileText },
        { title: "Refund Calculator", path: "/refund", icon: DollarSign },
        { title: "Finalized Refunds", path: "/refundslist", icon: FileSpreadsheet },
      ],
    },
    {
      title: "Worker Management",
      items: [
        { title: "My CVs", path: "/my-cvs", icon: FileText },
        { title: "CV Review", path: "/admin/cvwizard-review", icon: Users },
        { title: "Worker Album", path: "/wizardalbum", icon: Images },
        { title: "CV Settings", path: "/admin/cvwizard-settings", icon: Settings },
      ],
    },
    {
      title: "User Management",
      items: [
        { title: "Create User", path: "/admin/user-management", icon: Users },
        { title: "Manage Users", path: "/admin/user-list", icon: Users },
      ],
    },
    {
      title: "System",
      items: [
        { title: "Country Albums", path: "/hub", icon: MapPin },
        { title: "Site Guide", path: "/siteguide", icon: FileText },
        { title: "Reset Admin", path: "/admin/reset-admin", icon: Settings },
      ],
    },
  ];

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button
        size="sm"
        variant="default"
        onClick={() => setIsVisible(!isVisible)}
        className="h-10 px-3 rounded-full shadow-lg"
      >
        <Shield className="h-4 w-4 mr-2" />
        Admin Menu
      </Button>

      {isVisible && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent flex items-center gap-2">
                  <Shield className="h-8 w-8 text-primary" />
                  Admin Hub
                </h1>
                <p className="text-muted-foreground">Quick access to all system features</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sections.map((section) => (
                <div key={section.title} className="bg-card border rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold text-lg mb-3 text-primary">{section.title}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {section.items.map((item) => (
                      <Button
                        key={item.title}
                        variant="outline"
                        size="sm"
                        className="h-auto py-3 flex flex-col items-start gap-1 hover:bg-accent text-left justify-start"
                        onClick={() => {
                          if (item.action === "quick-lead") {
                            setShowQuickEntry(true);
                          } else if (item.path) {
                            handleNavigation(item.path);
                            setIsVisible(false);
                          }
                        }}
                      >
                        <item.icon className="h-4 w-4 mb-1" />
                        <span className="text-xs font-medium leading-tight">{item.title}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Shift+A</kbd> to toggle
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </div>
          </div>
        </div>
      )}

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
