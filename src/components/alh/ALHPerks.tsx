import { Gift, CreditCard, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";

const ALHPerks = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hasTracked, setHasTracked] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasTracked) {
          if ((window as any).gtag) {
            (window as any).gtag('event', 'view_perks_section');
          }
          setHasTracked(true);
        }
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasTracked]);

  const perks = [
    {
      icon: Gift,
      title: "Complimentary Move-In Clean",
      description: "Every buyer receives a complimentary Move-In Excellence clean",
      value: "AED 1,500 value"
    },
    {
      icon: CreditCard,
      title: "AED 3,000 Service Credit",
      description: "Redeemable toward P1 Direct-Hire or 2 weeks of P4 monthly system",
      value: "Credit included"
    },
    {
      icon: GraduationCap,
      title: "TADACADEMY Training",
      description: "Optional 'Hotel-Home' training session for the buyer's maid",
      value: "Premium add-on"
    }
  ];

  return (
    <section id="perks" ref={sectionRef} className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0B409C] mb-4">
            Buyer Perks
          </h2>
          <p className="text-xl text-[#4A4A4A] max-w-3xl mx-auto">
            Premium services and credits for every new homeowner
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {perks.map((perk, index) => {
            const Icon = perk.icon;
            return (
              <Card key={index} className="border-2 border-[#0B409C]/10 shadow-lg hover:shadow-xl hover:border-[#F58220]/30 transition-all duration-300" style={{ borderRadius: '16px' }}>
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#F58220] to-[#F58220]/80 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#1E1E1E] mb-3">{perk.title}</h3>
                  <p className="text-[#4A4A4A] mb-4">{perk.description}</p>
                  <div className="inline-block bg-[#27AE60]/10 text-[#27AE60] px-4 py-2 rounded-full font-semibold text-sm">
                    {perk.value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-[#B6BBC4] text-center mt-8 max-w-4xl mx-auto">
          * Buyer perk delivered as a service credit redeemable against eligible services (P1 Direct-Hire / P4 monthly). Not a promise to employ or sponsor a worker. Services are subject to scheduling, availability, and PDPL-compliant consent.
        </p>
      </div>
    </section>
  );
};

export default ALHPerks;
