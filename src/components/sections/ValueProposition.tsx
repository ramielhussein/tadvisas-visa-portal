
import { Shield, Clock, CreditCard, Users } from "lucide-react";
import { Link } from "react-router-dom";

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
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
            Don't have a maid? get a maid from TADMAIDS
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            TADMAIDS is a provider of domestic workers in UAE, our experience and origins go back to 2005. We can help you get Nannies, Housemaid, Driver, Cooks, Babysitters, and Caregivers too.
          </p>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
            WhatsApp us now and we will send you available applications.{" "}
            <Link to="/how-it-works" className="text-primary hover:text-primary-700 underline">
              Check out our simple process.
            </Link>
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
