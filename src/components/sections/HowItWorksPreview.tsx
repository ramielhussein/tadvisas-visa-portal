
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Cog, CheckCircle, ArrowRight } from "lucide-react";

const HowItWorksPreview = () => {
  const steps = [
    {
      icon: FileText,
      title: "Share Details",
      description: "Share your maid's Passport copy and Visa/Cancellation and your Emirates ID.",
      color: "text-blue-500"
    },
    {
      icon: Cog,
      title: "We Process",
      description: "We handle all documentation, medical tests, and visa processing paperwork. We even send her a car to do all the needed steps. You relax.",
      color: "text-orange-500"
    },
    {
      icon: CheckCircle,
      title: "You Receive",
      description: "Get your domestic worker legally with 100% compliance and zero hassles.",
      color: "text-green-500"
    }
  ];

  return (
    <section className="py-20 bg-gradient-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Getting your 2-year maid visa is simple and straightforward. 
            We handle everything so you don't have to worry about the complexities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center group">
              <div className="relative">
                <div className={`w-20 h-20 ${step.color} bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6`}>
                  <step.icon className={`w-10 h-10 ${step.color}`} />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-full">
                    <ArrowRight className="w-6 h-6 text-gray-400 mx-auto" />
                  </div>
                )}
              </div>
              <h3 className="text-xl font-semibold text-primary mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/how-it-works">
            <Button className="bg-primary hover:bg-primary-700 text-white px-8 py-3 text-lg">
              Learn More About Our Process
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksPreview;
