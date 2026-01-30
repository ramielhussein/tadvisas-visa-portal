import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Phone, MessageCircle } from "lucide-react";

const ThankYou = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Fire Google Ads conversion on page load
    if ((window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': 'AW-17128942210/form_submission',
        'event_category': 'form',
        'event_label': 'contact_form_submission'
      });
    }

    // Fire Meta Pixel conversion event
    if ((window as any).fbq) {
      (window as any).fbq('track', 'Lead');
    }
  }, []);

  const handleWhatsAppClick = () => {
    const message = "Hi! I just submitted my inquiry on your website. Can you help me?";
    window.open(`https://wa.me/971567222248?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCallClick = () => {
    if ((window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': 'AW-17128942210',
        'event_category': 'call',
        'event_label': 'thank_you_page_call'
      });
    }
    window.location.href = "tel:+971567222248";
  };

  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle className="w-14 h-14 text-green-600" />
            </div>
          </div>

          {/* Main Content */}
          <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-6">
            Thank You!
          </h1>
          
          <p className="text-xl text-gray-600 mb-4">
            Your message has been received successfully.
          </p>
          
          <p className="text-lg text-gray-500 mb-8">
            Our team will get back to you within <span className="font-semibold text-primary">24 hours</span>. 
            For immediate assistance, feel free to contact us directly.
          </p>

          {/* Quick Contact Options */}
          <div className="bg-gradient-to-r from-primary to-primary-700 rounded-2xl p-8 mb-8 text-white">
            <h2 className="text-xl font-semibold mb-4">Need Immediate Assistance?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3"
                onClick={handleWhatsAppClick}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                WhatsApp Us
              </Button>
              <Button 
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-6 py-3"
                onClick={handleCallClick}
              >
                <Phone className="w-5 h-5 mr-2" />
                Call Now
              </Button>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-semibold text-lg text-primary mb-4">What Happens Next?</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">1</span>
                <span>Our team reviews your inquiry</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">2</span>
                <span>We'll contact you to discuss your requirements</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">3</span>
                <span>Get personalized assistance for your visa needs</span>
              </li>
            </ul>
          </div>

          {/* Return Home */}
          <Button 
            variant="outline"
            className="px-8"
            onClick={() => navigate("/")}
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default ThankYou;
