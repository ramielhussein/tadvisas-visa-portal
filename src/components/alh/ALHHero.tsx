import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

const ALHHero = () => {
  const [currentHeadline, setCurrentHeadline] = useState(0);
  const headlines = [
    "FROM MOVE-IN TO\nLIVE-IN IN 72 HOURS",
    "Warmer Homes by ALH"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeadline((prev) => (prev + 1) % headlines.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const scrollToForm = () => {
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' });
    if ((window as any).gtag) {
      (window as any).gtag('event', 'click_cta', { label: 'book' });
    }
  };

  const handleDownload = () => {
    if ((window as any).gtag) {
      (window as any).gtag('event', 'click_cta', { label: 'download' });
    }
    // Add download link here when available
    window.open('#', '_blank');
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B409C] via-[#005792] to-[#0B409C] text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        <div className="mb-4 text-[#F58220] font-semibold tracking-wide uppercase text-sm">
          ALH PROPERTIES PRESENTS
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight transition-opacity duration-500">
          {headlines[currentHeadline].split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < headlines[currentHeadline].split('\n').length - 1 && <br />}
            </span>
          ))}
        </h1>
        
        <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
          Powered by TADMAIDS — hotel-grade handovers, insured squads, and concierge setup.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button
            onClick={scrollToForm}
            className="bg-[#F58220] hover:bg-[#F58220]/90 text-white px-8 py-6 text-lg font-semibold rounded-3xl shadow-xl"
            size="lg"
          >
            Book the Pilot
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            className="border-2 border-white bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-[#0B409C] px-8 py-6 text-lg font-semibold rounded-3xl"
            size="lg"
          >
            Download One-Pager
          </Button>
        </div>
        
        <div className="animate-bounce">
          <ChevronDown className="w-8 h-8 mx-auto text-white/70" />
        </div>
      </div>
    </section>
  );
};

export default ALHHero;
