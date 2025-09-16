
import { Shield, Clock, CreditCard, Users, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ValueProposition = () => {
  const values = [
    {
      icon: CreditCard,
      title: "Zero Monthly Fees",
      description: "Unlike others, we have an option of no monthly admin fees. Pay once, get your visa processed.",
      color: "text-green-500"
    },
    {
      icon: Shield,
      title: "100% Legal & Licensed",
      description: "Powered by TADMAIDS, fully licensed domestic workers services center. Legal compliance guaranteed.",
      color: "text-blue-500"
    },
    {
      icon: Clock,
      title: "Fast Processing",
      description: "Quick and efficient visa processing. Get your domestic worker legally in record time.",
      color: "text-orange-500"
    },
    {
      icon: Users,
      title: "1700+ Happy Clients",
      description: "Trusted by over 1700 families across UAE. Join our satisfied customer base.",
      color: "text-purple-500"
    }
  ];

  return (
    <section className="py-12 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-left md:text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
            Don't have a maid? Get a maid from TADMAIDS!
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl md:mx-auto">
            🌟 TADMAIDS – Your Trusted Partner Since 2005<br/>
            From <span style={{ color: '#c9a227' }}>AED2,100/month</span><br/>
            We provide experienced Housemaids, Nannies, Drivers, Cooks, Babysitters, and Caregivers across the UAE.
          </p>
          <p className="text-lg text-gray-600 max-w-3xl md:mx-auto mt-4">
            📲 WhatsApp us now to view available candidates and start our{" "}
            <Link to="/hire-a-maid" className="text-primary hover:text-primary-700 underline">
              simple, step-by-step process.
            </Link>
          </p>
          <div className="flex justify-start md:justify-center gap-4 mt-6">
            <Button
              onClick={() => {
                const message = "Hi, I need help hiring a maid";
                const url = `https://wa.me/971565822258?text=${encodeURIComponent(message)}`;
                window.open(url, '_blank');
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Hire a Maid
            </Button>
            <Button
              onClick={() => window.location.href = "tel:+97143551186"}
              variant="outline"
              className="border-2 border-primary text-primary hover:bg-primary hover:text-white px-6 py-3 text-lg font-semibold transition-all duration-300"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call Now
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <div 
              key={index} 
              className="text-center group hover-lift bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-lg transition-all duration-300"
            >
              <div className={`w-16 h-16 ${value.color} bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4`}>
                <value.icon className={`w-8 h-8 ${value.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-3">
                {value.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
