
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle } from "lucide-react";

const CTA = () => {
  const handleCallClick = () => {
    window.location.href = "tel:+971565822258";
  };

  const handleWhatsAppClick = () => {
    // Track WhatsApp click conversion
    if ((window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': 'AW-17128942210'
      });
    }
    const message = "Hi! I'm ready to start my 2-year maid visa process. Can you help me?";
    const url = `https://wa.me/971565822258?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <section className="py-12 lg:py-20 bg-gradient-primary text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold mb-6">
          Ready to Get Your Maid Visa?
        </h2>
        <p className="text-xl text-primary-100 mb-8 leading-relaxed">
          Join over 1700 satisfied families who chose TADVISAS for their domestic worker visa needs. 
          Get started today with zero monthly admin fees option with complete transparency. Don't have a worker? We can help you find a worker too.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleWhatsAppClick}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <MessageCircle className="w-5 h-5 mr-3" />
            Chat on WhatsApp
          </Button>
          <Button 
            onClick={handleCallClick}
            variant="outline-white" 
            className="px-8 py-4 text-lg font-semibold transition-all duration-300"
          >
            <Phone className="w-5 h-5 mr-3" />
            Call 0565822258 for help
          </Button>
        </div>

        <div className="mt-8 text-primary-100">
          <p>📞 +971565822258 | 📧 tadbeer@tadmaids.com</p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
