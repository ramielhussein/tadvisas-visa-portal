import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, MessageCircle, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/NotificationBell";
import QuickLeadEntry from "@/components/crm/QuickLeadEntry";
import { useUserRole } from "@/hooks/useUserRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  name: string;
  path: string;
}

const Navbar = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const { role, isAdmin, isSuperAdmin, isSales, isFinance, isProduct } = useUserRole();

  useEffect(() => {
    // Get current user from cached session (no network call)
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user || null;
      setUser(u);
      if (u) {
        // Get profile for full name
        supabase
          .from('profiles')
          .select('full_name')
          .eq('id', u.id)
          .single()
          .then(({ data }) => setProfile(data));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setProfile(data));
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Public nav items for non-authenticated users
  const publicNavItems: NavItem[] = [
    { name: "Home", path: "/" },
    { name: "Hire a Maid", path: "/hire-a-maid" },
    { name: "Get a Visa", path: "/get-a-visa" },
    { name: "Monthly Packages", path: "/monthly-packages" },
    { name: "FAQ", path: "/faq" },
    { name: "Contact", path: "/contact" },
  ];

  // Role-specific primary nav items (shown in header)
  const getRolePrimaryItems = (): NavItem[] => {
    if (isAdmin || isSuperAdmin) {
      return [
        { name: "CRM", path: "/crm" },
        { name: "Contracts", path: "/crm/contracts" },
        { name: "Finance", path: "/hub/finance" },
        { name: "HR", path: "/hr/dashboard" },
      ];
    }
    if (isFinance) {
      return [
        { name: "Finance", path: "/hub/finance" },
        { name: "Payments", path: "/finance/payments" },
        { name: "A/R Report", path: "/crm/contracts-ar" },
      ];
    }
    if (isSales) {
      return [
        { name: "My Leads", path: "/crm" },
        { name: "Contracts", path: "/crm/contracts" },
        { name: "CVs", path: "/my-cvs" },
      ];
    }
    if (isProduct) {
      return [
        { name: "Workers", path: "/my-cvs" },
        { name: "Transfers", path: "/worker-transfers" },
        { name: "Deliveries", path: "/delivery-orders" },
      ];
    }
    // Default for other authenticated users
    return [
      { name: "Hub", path: "/hub" },
    ];
  };

  // Role-specific secondary nav items (shown in "More" dropdown)
  const getRoleSecondaryItems = (): NavItem[] => {
    if (isAdmin || isSuperAdmin) {
      return [
        { name: "Workers/CVs", path: "/my-cvs" },
        { name: "Transfers", path: "/worker-transfers" },
        { name: "Sales Reports", path: "/crm/sales-reports" },
        { name: "Daily Sales", path: "/crm/daily-sales-report" },
        { name: "Payments", path: "/finance/payments" },
        { name: "Refunds", path: "/refunds" },
        { name: "A/R Report", path: "/crm/contracts-ar" },
        { name: "Deliveries", path: "/delivery-orders" },
        { name: "Admin Panel", path: "/admin" },
      ];
    }
    if (isFinance) {
      return [
        { name: "Bank Accounts", path: "/finance/bank-accounts" },
        { name: "Expenses", path: "/finance/expenses" },
        { name: "Refunds", path: "/refunds" },
        { name: "Contracts", path: "/crm/contracts" },
      ];
    }
    if (isSales) {
      return [
        { name: "Sales Reports", path: "/crm/sales-reports" },
        { name: "My Dashboard", path: "/hub/sales/person" },
        { name: "Manager View", path: "/hub/sales/manager" },
      ];
    }
    if (isProduct) {
      return [
        { name: "Receipt Orders", path: "/receipt-orders" },
        { name: "Purchase Orders", path: "/purchase-orders" },
        { name: "CV Prospects", path: "/cv-prospects" },
      ];
    }
    return [];
  };

  const primaryItems = user ? getRolePrimaryItems() : publicNavItems;
  const secondaryItems = user ? getRoleSecondaryItems() : [];

  const handleAddLead = () => {
    setShowQuickEntry(true);
  };

  const handleQuickEntrySuccess = () => {
    navigate("/crm");
  };

  const handleWhatsAppClick = () => {
    // Track WhatsApp click conversion
    if ((window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': 'AW-17128942210'
      });
    }
    window.open("https://wa.me/971567222248", "_blank");
  };

  const handleLogoDoubleClick = () => {
    if (user) {
      navigate("/admin");
    } else {
      navigate("/auth");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            onDoubleClick={handleLogoDoubleClick}
            className="flex items-center cursor-pointer select-none"
          >
            <img 
              src="/lovable-uploads/4e5c7620-b6a4-438c-a61b-eaa4f96ea0c2.png" 
              alt="TADMAIDS" 
              className="h-8 w-auto pointer-events-none"
              draggable="false"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Add Lead button for authenticated users */}
            {user && (isSales || isAdmin || isSuperAdmin) && (
              <button
                onClick={handleAddLead}
                className="font-medium text-primary hover:text-primary/80 transition-colors duration-200"
              >
                + ADD LEAD
              </button>
            )}

            {/* Primary nav items */}
            {primaryItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="font-medium text-gray-700 hover:text-primary transition-colors duration-200"
              >
                {item.name}
              </Link>
            ))}

            {/* More dropdown for authenticated users */}
            {user && secondaryItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 font-medium text-gray-700 hover:text-primary transition-colors duration-200">
                    More
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {secondaryItems.map((item, index) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link to={item.path} className="w-full cursor-pointer">
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/hub" className="w-full cursor-pointer font-medium">
                      View All (Hub)
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Start Here button for public users */}
            {!user && (
              <Link
                to="/start-here"
                className="bg-yellow-500 text-black px-4 py-2 rounded-full hover:bg-yellow-600 font-bold transition-colors duration-200"
              >
                Start Here & Now
              </Link>
            )}

            {/* User section */}
            {user ? (
              <div className="flex items-center gap-4">
                <NotificationBell />
                <div 
                  onDoubleClick={handleLogout}
                  className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                  title="Double-click to logout"
                >
                  <User className="h-4 w-4" />
                  <span className="font-medium">
                    {profile?.full_name || user.email}
                  </span>
                </div>
              </div>
            ) : (
              <Button asChild className="bg-green-500 hover:bg-green-600 text-white">
                <a href="https://wa.me/971567222248" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp Now
                </a>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {!user && (
              <a 
                href="https://wa.me/971567222248" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-500 font-semibold text-sm"
              >
                WhatsApp Us
              </a>
            )}
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-primary p-2"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Add Lead for mobile */}
              {user && (isSales || isAdmin || isSuperAdmin) && (
                <button
                  onClick={() => {
                    handleAddLead();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 font-medium text-primary hover:bg-muted rounded"
                >
                  + ADD LEAD
                </button>
              )}

              {/* Primary items */}
              {primaryItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="block px-3 py-2 font-medium text-gray-700 hover:text-primary hover:bg-muted rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {/* Secondary items for authenticated users */}
              {user && secondaryItems.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    More
                  </div>
                  {secondaryItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      className="block px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-muted rounded ml-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </>
              )}

              {/* Hub link for authenticated users */}
              {user && (
                <Link
                  to="/hub"
                  className="block px-3 py-2 font-medium text-primary hover:bg-muted rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  View All (Hub)
                </Link>
              )}

              {/* User section */}
              {user ? (
                <div className="px-3 py-2 flex items-center gap-3 border-t mt-2 pt-2">
                  <NotificationBell />
                  <span 
                    onDoubleClick={handleLogout}
                    className="text-sm text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                    title="Double-click to logout"
                  >
                    {profile?.full_name || user.email}
                  </span>
                </div>
              ) : (
                <div className="px-3 py-2 space-y-2 border-t mt-2 pt-2">
                  <Button asChild className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                    <Link to="/start-here" onClick={() => setIsMenuOpen(false)}>
                      Apply Now
                    </Link>
                  </Button>
                  <Button asChild className="w-full bg-green-500 hover:bg-green-600 text-white">
                    <a href="https://wa.me/971567222248" target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp Now
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Lead Entry Dialog */}
      {user && (
        <QuickLeadEntry
          open={showQuickEntry}
          onClose={() => setShowQuickEntry(false)}
          onSuccess={handleQuickEntrySuccess}
        />
      )}
    </nav>
  );
};

export default Navbar;
