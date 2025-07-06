
import { Shield, Clock, CreditCard, Users } from "lucide-react";

const ValueProposition = () => {
  const values = [
    {
      icon: CreditCard,
      title: "Zero Monthly Fees",
      description: "Unlike others, we charge no monthly admin fees. Pay once, get your visa processed.",
      color: "text-green-500"
    },
    {
      icon: Shield,
      title: "100% Legal & Licensed",
      description: "Fully licensed domestic workers services center. Legal compliance guaranteed.",
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
      title: "1400+ Happy Clients",
      description: "Trusted by over 1400 families across UAE. Join our satisfied customer base.",
      color: "text-purple-500"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
            Why Choose TADVISAS?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Because we are not here to hook you up for 2 years. We have no intention of taking your maid under the pretense of helping you. We do a service get paid once and will not blackmail you with monthly payments forever.
          </p>
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
