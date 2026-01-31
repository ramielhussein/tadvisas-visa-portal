import { useState, useEffect } from "react";
import { Moon } from "lucide-react";
import { trackContact } from "@/lib/metaTracking";

const TopBanner = () => {
  const [daysToRamadan, setDaysToRamadan] = useState(0);

  useEffect(() => {
    const calculateDays = () => {
      const ramadanStart = new Date("2026-02-17T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = ramadanStart.getTime() - today.getTime();
      setDaysToRamadan(Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24))));
    };
    calculateDays();
    const interval = setInterval(calculateDays, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, []);

  const handleWhatsAppClick = () => {
    // Track WhatsApp - Google Ads
    if ((window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': 'AW-17128942210'
      });
    }
    // Track WhatsApp - Meta Pixel + CAPI
    trackContact();
    const message = encodeURIComponent("Hello! I want to apply for my maid's visa online.");
    window.open(`https://wa.me/971567222248?text=${message}`, "_blank");
  };

  return (
    <>
      <section className="relative w-full bg-white overflow-hidden">
        <div className="container mx-auto px-4 py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Left side - Ramadan Countdown */}
            <div className="relative w-full lg:w-1/2 flex items-center justify-center">
              <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-8 shadow-2xl w-full max-w-md">
                <div className="text-center">
                  <Moon className="w-16 h-16 text-yellow-300 animate-pulse mx-auto mb-4" />
                  <h3 className="text-white/80 text-xl mb-2">
                    Days to Ramadan 2026
                  </h3>
                  <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-orange-400 mb-2">
                    {daysToRamadan}
                  </div>
                  <div className="text-white/60 text-lg">
                    days remaining
                  </div>
                  <div className="mt-4 text-white/40 text-sm">
                    Expected: February 17, 2026
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