
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <img 
              src="/lovable-uploads/4e5c7620-b6a4-438c-a61b-eaa4f96ea0c2.png" 
              alt="TADMAIDS" 
              className="h-8 w-auto brightness-0 invert"
            />
            <p className="text-blue-100">
              Your trusted partner for domestic workers, and 2-year maid visa services in UAE. 
              100% Tadbeer licensed with an option for zero monthly admin fees.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-blue-100 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/hire-a-maid" className="text-blue-100 hover:text-white transition-colors">I want a maid</Link></li>
              <li><Link to="/get-a-visa" className="text-blue-100 hover:text-white transition-colors">Visa Fees</Link></li>
              <li><Link to="/monthly-packages" className="text-blue-100 hover:text-white transition-colors">Visa Options</Link></li>
              <li><Link to="/faq" className="text-blue-100 hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="text-blue-100 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Services</h3>
            <ul className="space-y-2 text-blue-100">
              <li>2-Year Maid Visa</li>
              <li>Hire a worker</li>
              <li>Medical & Emirates ID</li>
              <li>All domestic workers services</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-300" />
                <span className="text-blue-100">+97143551186</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-300" />
                <span className="text-blue-100">tadbeer@tadmaids.com</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-300 mt-1" />
                <span className="text-blue-100">
                  Tadmaids Center, Dubai, UAE
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-600 mt-8 pt-8 text-center">
          <p className="text-blue-100">
            © <Link to="/admin" className="text-blue-100 hover:text-white transition-colors">2025</Link> <Link to="/cvwizard" className="text-blue-100 hover:text-white transition-colors">tadmaids.com</Link> - Tadmaids Domestic Workers Services Center. All <Link to="/hub" className="text-blue-100 hover:text-white transition-colors">rights</Link> <Link to="/refund" className="text-blue-100 hover:text-white transition-colors">reserved</Link>.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
