
import { Star, Users, Award, Clock } from "lucide-react";

const TrustIndicators = () => {
  const stats = [
    {
      icon: Users,
      number: "1700+",
      label: "Happy Families",
      color: "text-blue-500"
    },
    {
      icon: Award,
      number: "100%",
      label: "MOHRE Licensed",
      color: "text-green-500"
    },
    {
      icon: Clock,
      number: "22",
      label: "Years Experience",
      color: "text-orange-500"
    },
    {
      icon: Star,
      number: "4.9/5",
      label: "Customer Rating",
      color: "text-yellow-500"
    }
  ];

  return (
    <section className="py-20 bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Join the growing family of satisfied customers who trust TADVISAS 
            for their domestic worker visa needs.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className={`w-16 h-16 ${stat.color} bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div className="text-4xl font-bold text-white mb-2">
                {stat.number}
              </div>
              <div className="text-primary-100 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonial Preview */}
        <div className="mt-16 bg-white bg-opacity-10 rounded-2xl p-8 text-center">
          <div className="flex justify-center mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
            ))}
          </div>
          <p className="text-lg text-primary-100 italic mb-4">
            "TADVISAS made the entire process so smooth and transparent. 
            No hidden fees, no surprises. Just professional service from start to finish."
          </p>
          <div className="text-white font-semibold">- Ahmed M., Dubai</div>
        </div>
      </div>
    </section>
  );
};

export default TrustIndicators;
