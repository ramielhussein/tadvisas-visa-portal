import { Star } from "lucide-react";
import { trackContact } from "@/lib/metaTracking";

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
    <>
      <section className="relative w-full bg-white overflow-hidden">
        <div className="container mx-auto px-4 py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Left side - Eid Mubarak */}
            <div className="relative w-full lg:w-1/2 flex items-center justify-center">
              <div className="relative rounded-2xl p-8 shadow-2xl w-full max-w-md overflow-hidden">
                {/* UAE flag layout: red vertical bar left, 3 horizontal stripes right */}
                <div className="absolute inset-0 flex">
                  <div className="w-1/4 bg-[#EF3340]" />
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 bg-[#00732F]" />
                    <div className="flex-1 bg-white" />
                    <div className="flex-1 bg-[#000000]" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/65" />
                <div className="relative z-10 text-center">
                  <div className="flex justify-center gap-2 mb-4">
                    <Star className="w-8 h-8 text-yellow-300 fill-yellow-300 animate-pulse" />
                    <Star className="w-10 h-10 text-yellow-400 fill-yellow-400 animate-pulse" />
                    <Star className="w-8 h-8 text-yellow-300 fill-yellow-300 animate-pulse" />
                  </div>
                  
                  <h3 className="text-yellow-300 text-3xl lg:text-4xl font-bold mb-2 tracking-wide">
                    EID MUBARAK
                  </h3>
                  <div className="text-7xl lg:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-orange-400 mb-2">
                    2026
                  </div>
                  <p className="text-white/70 text-lg">
                    Wishing you joy, peace & blessings
                  </p>

                  <div className="flex justify-center gap-2 mt-4">
                    <Star className="w-5 h-5 text-yellow-300/60 fill-yellow-300/60" />
                    <Star className="w-5 h-5 text-yellow-300/60 fill-yellow-300/60" />
                    <Star className="w-5 h-5 text-yellow-300/60 fill-yellow-300/60" />
                  </div>
                </div>
              </div>
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
    </>
  );
};

export default TopBanner;