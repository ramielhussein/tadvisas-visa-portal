import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/NotificationBell";

const Navbar = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        // Get profile for full name
        supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
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

  const publicNavItems = [
    { name: "Home", path: "/" },
    { name: "Hire a Maid", path: "/hire-a-maid" },
    { name: "Get a Visa", path: "/get-a-visa" },
    { name: "Monthly Packages", path: "/monthly-packages" },
    { name: "FAQ", path: "/faq" },
    { name: "Contact", path: "/contact" },
  ];

  const authenticatedNavItems = [
    { name: "Home", path: "/" },
    { name: "Browse Workers", path: "/hub" },
    { name: "My CVs", path: "/my-cvs" },
    { name: "Dashboard", path: "/crm/dashboard" },
    { name: "Admin", path: "/admin" },
    { name: "Site Guide", path: "/siteguide" },
  ];

  const navItems = user ? authenticatedNavItems : publicNavItems;
  const authenticatedItems = user ? navItems : [...navItems, { name: "Start Here & Now", path: "/start-here" }];

  const handleWhatsAppClick = () => {
    // Track WhatsApp click conversion
    if ((window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': 'AW-17128942210'
      });
    }
    window.open("https://wa.me/971565822258", "_blank");
  };
  // Backward compat: ensure any leftover call handler points to WhatsApp
  const handleCallClick = handleWhatsAppClick;

  const handleLogoDoubleClick = () => {
    if (user) {
      navigate("/admin");
    } else {
      navigate("/auth");
    }
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
          <div className="hidden md:flex items-center space-x-8">
            {authenticatedItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`font-medium transition-colors duration-200 ${
                  item.name === "Start Here & Now" 
                    ? "bg-yellow-500 text-black px-4 py-2 rounded-full hover:bg-yellow-600 font-bold" 
                    : "text-gray-700 hover:text-primary"
                }`}
              >
                {item.name}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center gap-4">
                <NotificationBell />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="font-medium">
                    {profile?.full_name || user.email}
                  </span>
                </div>
              </div>
            ) : (
              <Button asChild className="bg-green-500 hover:bg-green-600 text-white">
                <a href="https://wa.me/971565822258" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp Now
                </a>
              </Button>
            )}
          </div>

          {/* Mobile menu button and WhatsApp button */}
          <div className="md:hidden flex items-center gap-2">
            <a 
              href="https://wa.me/971567222248" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-green-500 font-semibold text-sm"
            >
              WhatsApp Us
            </a>
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
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="block px-3 py-2 font-medium text-gray-700 hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {user ? (
                <div className="px-3 py-2 flex items-center gap-3">
                  <NotificationBell />
                  <span className="text-sm text-muted-foreground">
                    {profile?.full_name || user.email}
                  </span>
                </div>
              ) : (
                <div className="px-3 py-2 space-y-2">
                  <Button asChild className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                    <Link to="/start-here" onClick={() => setIsMenuOpen(false)}>
                      Apply Now
                    </Link>
                  </Button>
                  <Button asChild className="w-full bg-green-500 hover:bg-green-600 text-white">
                    <a href="https://wa.me/971565822258" target="_blank" rel="noopener noreferrer">
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
    </nav>
  );
};

export default Navbar;
