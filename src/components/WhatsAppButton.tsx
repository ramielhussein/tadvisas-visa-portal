import { MessageCircle } from "lucide-react";
import { trackContact } from "@/lib/metaTracking";

const WhatsAppButton = () => {
  const whatsappNumber = "+971567222248";
  const message = "Hi! I'm interested in your 2-year maid visa service. Can you help me?";
  
  const handleWhatsAppClick = () => {
    // Track WhatsApp click - Google Ads Enhanced Conversion
    if ((window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': 'AW-17918343259/CqN5CN-Uj_AbENvwkOBC',
        'value': 1.0,
        'currency': 'AED'
      });
    }
    // Track WhatsApp click - Meta Pixel + CAPI
    trackContact();
    
    const url = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover-lift z-50"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
};

export default WhatsAppButton;
