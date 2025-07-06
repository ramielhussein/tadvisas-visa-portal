
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, CheckCircle } from "lucide-react";

const Hero = () => {
  const handleCallClick = () => {
    window.location.href = "tel:+971565822258";
  };

  const handleWhatsAppClick = () => {
    const message = "Hi! I'm interested in your 2-year maid visa service. Can you help me?";
    const url = `https://wa.me/971565822258?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <section className="bg-gradient-light py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="animate-fade-in">
            <h1 className="text-4xl lg:text-6xl font-bold text-primary mb-6 text-shadow">
              Your Maid Visa,<br />
              <span className="text-accent">Done Right.</span><br />
              <span className="text-2xl lg:text-3xl font-semibold text-gray-700">
                No Hidden Fees. Ever.
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Get your 2-year maid visa processed by UAE's most trusted Tadbeer licensed center. 
              Transparent pricing, zero monthly admin fees, and 100% legal compliance guaranteed.
            </p>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                "No Monthly Admin Fees",
                "100% Tadbeer Licensed",
                "Fast & Legal Processing",
                "Transparent Pricing"
              ].map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-gray-700 font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleWhatsAppClick}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <MessageCircle className="w-5 h-5 mr-3" />
                WhatsApp Us Now
              </Button>
              <Button 
                onClick={handleCallClick}
                variant="outline" 
                className="border-2 border-primary text-primary hover:bg-primary hover:text-white px-8 py-4 text-lg font-semibold transition-all duration-300"
              >
                <Phone className="w-5 h-5 mr-3" />
                Call Now
              </Button>
            </div>
          </div>

          {/* Right Column - Image/Visual */}
          <div className="animate-slide-in">
            <div className="bg-white rounded-2xl p-8 shadow-2xl hover-lift">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-3xl font-bold">✓</span>
                </div>
                <h3 className="text-2xl font-bold text-primary mb-4">
                  Licensed & Trusted
                </h3>
                <p className="text-gray-600 mb-6">
                  One of only 150 Tadbeer licensed centers in UAE. 
                  Over 1700+ happy families trust us with their visa needs.
                </p>
                <div className="bg-gradient-gold text-white rounded-lg p-4">
                  <div className="text-3xl font-bold">0 AED</div>
                  <div className="text-sm opacity-90">Monthly Admin Fees</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
