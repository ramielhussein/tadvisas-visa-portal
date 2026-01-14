import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, CheckCircle } from "lucide-react";
import RamadanCountdown from "./RamadanCountdown";

const Hero = () => {
  const handleCallClick = () => {
    window.location.href = "tel:+97143551186";
  };

  const handleWhatsAppClick = () => {
    // Track WhatsApp click conversion
    if ((window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': 'AW-17128942210'
      });
    }
    const message = "Hi! I'm interested in your 2-year maid visa service. Can you help me?";
    const url = `https://wa.me/971567222248?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <section className="py-12 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="animate-fade-in">
            <div className="mb-4">
              <RamadanCountdown />
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-primary mb-6 text-shadow">
              Your Maid Visa,<br />
              <span className="text-accent">Done Right.</span><br />
              <span className="text-2xl lg:text-3xl font-semibold text-gray-700">
                No Hidden Fees. Ever.
              </span>
            </h1>
            
            <p className="text-lg text-gray-600 mb-4 leading-relaxed">
              Get your 2-year maid visa processed by UAE's most trusted MOHRE licensed center. 
              Transparent pricing, with an option of zero monthly admin fees, and 100% legal compliance guaranteed.
            </p>
            
            <div className="mb-8">
              <h2 className="text-2xl font-bold" style={{ color: '#c9a227' }}>
                Why choose TADMAIDS
              </h2>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                "No Monthly Admin Fees",
                "100% MOHRE Licensed",
                "Fast & Legal Processing",
                "Transparent Pricing",
                "No Office visits required",
                "Cancel Any Time"
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
                Chat on WhatsApp
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

          {/* Right Column - Ramadan Countdown */}
          <div className="hidden lg:block animate-slide-in">
            <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-8 shadow-2xl hover-lift">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-yellow-300 text-4xl">🌙</span>
                </div>
                <h3 className="text-white/80 text-xl mb-4">
                  Days to Ramadan 2026
                </h3>
                <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-orange-400 mb-2">
                  {(() => {
                    const ramadanStart = new Date("2026-02-17T00:00:00");
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const diffTime = ramadanStart.getTime() - today.getTime();
                    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                  })()}
                </div>
                <div className="text-white/60 text-lg">
                  days remaining
                </div>
                <div className="mt-6 text-white/40 text-sm">
                  Expected: February 17, 2026
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
