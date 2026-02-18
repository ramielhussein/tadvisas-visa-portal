import { useState, useEffect } from "react";
import { Moon, Sunrise, Sunset } from "lucide-react";
import { trackContact } from "@/lib/metaTracking";

interface PrayerTimings {
  Fajr: string;
  Maghrib: string;
  Imsak: string;
}

interface HijriDate {
  day: string;
  month: { en: string; number: number };
}

const TopBanner = () => {
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [hijriDate, setHijriDate] = useState<HijriDate | null>(null);
  const [isRamadan, setIsRamadan] = useState(false);
  const [daysToRamadan, setDaysToRamadan] = useState(0);

  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const res = await fetch(
          `https://api.aladhan.com/v1/timingsByCity/${dd}-${mm}-${yyyy}?city=Dubai&country=UAE&method=4`
        );
        const data = await res.json();
        if (data.code === 200) {
          setTimings(data.data.timings);
          const hijri = data.data.date.hijri;
          setHijriDate({ day: hijri.day, month: { en: hijri.month.en, number: hijri.month.number } });
          setIsRamadan(hijri.month.number === 9);
        }
      } catch (e) {
        console.error("Failed to fetch prayer times:", e);
      }
    };

    // Calculate days to Ramadan as fallback
    const ramadanStart = new Date("2026-02-17T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = ramadanStart.getTime() - today.getTime();
    setDaysToRamadan(Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24))));

    fetchPrayerTimes();
  }, []);

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
            {/* Left side - Ramadan Calendar */}
            <div className="relative w-full lg:w-1/2 flex items-center justify-center">
              <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-8 shadow-2xl w-full max-w-md">
                <div className="text-center">
                  <Moon className="w-12 h-12 text-yellow-300 animate-pulse mx-auto mb-3" />
                  
                  {isRamadan && hijriDate ? (
                    <>
                      <h3 className="text-yellow-300 text-2xl font-bold mb-1">
                        Ramadan Kareem
                      </h3>
                      <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-orange-400 mb-1">
                        {hijriDate.day}
                      </div>
                      <div className="text-white/70 text-lg mb-4">Ramadan</div>

                      {timings && (
                        <div className="flex justify-center gap-6 mt-2">
                          <div className="bg-white/10 rounded-xl px-5 py-3 text-center">
                            <Sunrise className="w-5 h-5 text-amber-300 mx-auto mb-1" />
                            <div className="text-white/50 text-xs uppercase tracking-wide">Imsak</div>
                            <div className="text-yellow-300 text-xl font-bold">{timings.Imsak}</div>
                          </div>
                          <div className="bg-white/10 rounded-xl px-5 py-3 text-center">
                            <Sunset className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                            <div className="text-white/50 text-xs uppercase tracking-wide">Iftar</div>
                            <div className="text-yellow-300 text-xl font-bold">{timings.Maghrib}</div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 className="text-white/80 text-xl mb-2">
                        Days to Ramadan 2026
                      </h3>
                      <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-orange-400 mb-2">
                        {daysToRamadan}
                      </div>
                      <div className="text-white/60 text-lg">days remaining</div>
                      <div className="mt-4 text-white/40 text-sm">
                        Expected: February 17, 2026
                      </div>
                    </>
                  )}
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