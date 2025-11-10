import { Target, BarChart3, Clock, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ALHPilot = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hasTracked, setHasTracked] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasTracked) {
          if ((window as any).gtag) {
            (window as any).gtag('event', 'view_pilot_section');
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

  const items = [
    {
      icon: Target,
      title: "Scope",
      description: "30 units across multiple communities"
    },
    {
      icon: BarChart3,
      title: "KPIs",
      description: "Handover satisfaction, voucher redemption %, P1/P4 conversions, repeat cleans"
    },
    {
      icon: Clock,
      title: "SLA",
      description: "72-hour delivery from key handover"
    },
    {
      icon: FileText,
      title: "Reporting",
      description: "Daily capacity snapshot; weekly SLA/NPS report; 30-day review"
    }
  ];

  return (
    <section id="pilot" ref={sectionRef} className="py-20 bg-[#F5F7FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0B409C] mb-4">
            Pilot Program
          </h2>
          <p className="text-xl text-[#4A4A4A] max-w-3xl mx-auto">
            60-day structured pilot with clear KPIs and reporting
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-start space-x-4 bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0B409C] to-[#005792] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1E1E1E] mb-2">{item.title}</h3>
                  <p className="text-[#4A4A4A]">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ALHPilot;
