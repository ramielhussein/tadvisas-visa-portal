import { CheckCircle, Sparkles, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";

const ALHTimeline = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hasTracked, setHasTracked] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasTracked) {
          if ((window as any).gtag) {
            (window as any).gtag('event', 'view_timeline_section');
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

  const days = [
    {
      icon: CheckCircle,
      day: "Day 1",
      title: "Pre-Handover Snagging Clean",
      description: "Construction dust removal, grout/tiles, windows, kitchen prep.",
      items: ["Dust & debris removal", "Grout & tile cleaning", "Window deep clean", "Kitchen preparation"]
    },
    {
      icon: Sparkles,
      day: "Day 2",
      title: "Move-In Detail Clean",
      description: "Cabinets, appliances, bathroom descaling, balcony & glass.",
      items: ["Cabinet detailing", "Appliance polish", "Bathroom descaling", "Balcony & glass"]
    },
    {
      icon: Home,
      day: "Day 3",
      title: "Welcome-Home Setup",
      description: "Scenting, towel folds, table/bed styling; optional maid concierge visit.",
      items: ["Home scenting", "Towel arrangement", "Styling touches", "TADACADEMY option"]
    }
  ];

  return (
    <section id="how" ref={sectionRef} className="py-20 bg-[#F5F7FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0B409C] mb-4">
            72-Hour Promise
          </h2>
          <p className="text-xl text-[#4A4A4A] max-w-3xl mx-auto">
            SLA: dispatch 24–48h, supervisor sign-off, photo report.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {days.map((day, index) => {
            const Icon = day.icon;
            return (
              <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300" style={{ borderRadius: '16px' }}>
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#0B409C] to-[#005792] rounded-full flex items-center justify-center mb-6 mx-auto">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-[#F58220] font-bold text-sm mb-2 text-center">{day.day}</div>
                  <h3 className="text-xl font-bold text-[#1E1E1E] mb-3 text-center">{day.title}</h3>
                  <p className="text-[#4A4A4A] mb-6 text-center">{day.description}</p>
                  <div className="space-y-2">
                    {day.items.map((item, i) => (
                      <div key={i} className="flex items-center text-sm text-[#4A4A4A]">
                        <CheckCircle className="w-4 h-4 text-[#27AE60] mr-2 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ALHTimeline;
