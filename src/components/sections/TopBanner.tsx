import { trackContact } from "@/lib/metaTracking";
import visaWhatsApp from "@/assets/visa-whatsapp.png";

const TopBanner = () => {
  const handleWhatsAppClick = () => {
    if ((window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': 'AW-17918343259/CqN5CN-Uj_AbENvwkOBC',
        'value': 1.0,
        'currency': 'AED'
      });
    }
    trackContact();
    const message = encodeURIComponent("Hello! I want to apply for my maid's visa online.");
    window.open(`https://wa.me/971567222248?text=${message}`, "_blank");
  };

  return (
    <section className="relative w-full bg-white overflow-hidden">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Left side - WhatsApp phone mockup */}
          <div className="relative w-full lg:w-1/2 flex items-center justify-center">
            <img
              src={visaWhatsApp}
              alt="WhatsApp visa application chat"
              className="max-h-[400px] w-auto object-contain cursor-pointer"
              onClick={handleWhatsAppClick}
            />
          </div>

          {/* Right side - Call to action */}
          <div className="w-full lg:w-1/2 text-center lg:text-left space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Apply for Your Maid's Visa in<br /><span className="text-primary">5 Minutes</span>
            </h2>
            <p className="text-muted-foreground text-base">
              Just send us your maid's passport through WhatsApp and get it done in 1 week!
            </p>
            <div className="hidden md:flex items-center gap-6 justify-center lg:justify-start text-sm text-muted-foreground mt-4">
              <span className="flex items-center gap-1">
                ✅ Licensed by DLD
              </span>
              <span className="flex items-center gap-1">
                ⚡ 1 Week Processing
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TopBanner;