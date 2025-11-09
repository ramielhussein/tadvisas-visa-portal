import { TrendingUp, Shield, DollarSign, Zap } from "lucide-react";

const ALHBenefits = () => {
  const benefits = [
    {
      icon: TrendingUp,
      title: "Differentiate with live-in-ready promise"
    },
    {
      icon: Shield,
      title: "Reduce 30-day post-handover complaints"
    },
    {
      icon: DollarSign,
      title: "Unlock new revenue on post-handover upgrades"
    },
    {
      icon: Zap,
      title: "Zero ops burden: insured squads, WhatsApp booking"
    }
  ];

  return (
    <section id="benefits" className="py-20 bg-gradient-to-br from-[#0B409C] to-[#005792] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why ALH Wins
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            A complete handover experience that sets you apart
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 mx-auto hover:bg-white/20 transition-colors">
                  <Icon className="w-8 h-8 text-[#F58220]" />
                </div>
                <p className="font-semibold text-lg">{benefit.title}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 flex justify-center gap-8 flex-wrap">
          <div className="text-center">
            <div className="text-5xl font-bold text-[#F58220] mb-2">72h</div>
            <div className="text-sm text-white/80">Delivery SLA</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-[#F58220] mb-2">24-48h</div>
            <div className="text-sm text-white/80">Dispatch Time</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-[#F58220] mb-2">100%</div>
            <div className="text-sm text-white/80">Supervisor Sign-off</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ALHBenefits;
