
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "How It Works", path: "/how-it-works" },
    { name: "Visa Pricing", path: "/pricing" },
    { name: "Visa Table of Benefits", path: "/why-us" },
    { name: "FAQ", path: "/faq" },
    { name: "Contact", path: "/contact" },
    { name: "Start Here & Now", path: "/start-here" },
  ];

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/971565822258", "_blank");
  };
  // Backward compat: ensure any leftover call handler points to WhatsApp
  const handleCallClick = handleWhatsAppClick;

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/4e5c7620-b6a4-438c-a61b-eaa4f96ea0c2.png" 
              alt="TADMAIDS" 
              className="h-8 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
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
            <Button asChild className="bg-green-500 hover:bg-green-600 text-white">
              <a href="https://wa.me/971565822258" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp Now
              </a>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
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
                  className={`block px-3 py-2 font-medium ${
                    item.name === "Start Here & Now"
                      ? "bg-yellow-500 text-black rounded-lg mx-2 hover:bg-yellow-600 font-bold"
                      : "text-gray-700 hover:text-primary"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="px-3 py-2">
                <Button asChild className="w-full bg-green-500 hover:bg-green-600 text-white">
                  <a href="https://wa.me/971565822258" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp Now
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
