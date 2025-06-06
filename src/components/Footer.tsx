
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold text-lg">T</span>
              </div>
              <span className="font-bold text-xl">TADVISAS</span>
            </div>
            <p className="text-primary-100">
              Your trusted partner for 2-year maid visa services in UAE. 
              100% Tadbeer licensed with zero monthly admin fees.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/how-it-works" className="text-primary-100 hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/pricing" className="text-primary-100 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link to="/why-us" className="text-primary-100 hover:text-white transition-colors">Why Choose Us</Link></li>
              <li><Link to="/faq" className="text-primary-100 hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Services</h3>
            <ul className="space-y-2 text-primary-100">
              <li>2-Year Maid Visa</li>
              <li>Visa Transfer</li>
              <li>Medical & Emirates ID</li>
              <li>Legal Documentation</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-accent" />
                <span className="text-primary-100">+971 50 123 4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-accent" />
                <span className="text-primary-100">info@tadvisas.com</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-accent mt-1" />
                <span className="text-primary-100">
                  Tadmaids Center, Dubai, UAE
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-600 mt-8 pt-8 text-center">
          <p className="text-primary-100">
            © 2025 TADVISAS.com - Tadmaids Domestic Workers Services Center. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
