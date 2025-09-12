
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { FileText, ArrowDownToLine, Cog, FileCheck, Users, CheckCircle, Phone, ChevronRight } from "lucide-react";
import manThinking from "@/assets/man-thinking-2.png";
import crossroad from "@/assets/crossroad.png";

const HowItWorks = () => {
  const steps = [
    {
      icon: ArrowDownToLine,
      title: "1. Yes! money matters",
      description: "If you have a worker and want a visa, you are saving money, if you need a worker you have to consider that there is an additional significant fees involved.",
      details: [
        "The maid fees capped by MOHRE start from 5250 all the way to 15750 for workers depend on the nationality. Here is the most common ones",
        "Philippines, India, Myanmar 12600 | Ethiopia 5250, Uganda Kenya 6825 | Indonesia Sri Lanka 15750",
        "Please remember these costs are on top of any visa fees or salary. If you actually prefer or want a Monthly Inclusive package please check the section Monthly Packages."
      ]
    },
    {
      icon: FileText,
      title: "2. Think of the path to follow",
      description: "We collect all necessary documents from you and your domestic worker in 2 minutes. Email or WhatsApp them and off we go.",
      details: [
        "Path1 - Get a worker, pay our fees, get a visa, pay a fee to us or to the authorities if you want to sponsor yourself, then do the medical insurance and pay a significantly smaller monthly salary to the worker, This is the most economic way, You save around 15000 to 25000 Dhs over two years contract, PLEASE DO THE MATH. But at what cost? You risk losing the cost of the visa, while we can give you a replacement worker but not replacement visa, that is an additional cost.",
        "Path2- Convenience comes with a price. We will be happy to give you a worker on a monthly fixed fee. Pay one time per month inclusive of Worker Salary, Visa, insurance, and our fees. Overall you will be paying more over a 2 years contract but your risk will always be limited to the month you are in and we will happily replace the worker unlimited amount of times. Tough choice!"
      ]
    },
    {
      icon: Cog,
      title: "3. Visa Processing",
      description: "Our team handles all government procedures, medical tests, and paperwork.",
      details: ["Government submissions (pre approval, visa, vpa, EID, medical)", "Medical appointments, we will chauffer her back and for.", "Emirates ID processing, will drop your worker and return her safe and sound.", "Tawjeeh Session, this is compulsory for Center Workers, it takes 2 hours."]
    },
    {
      icon: FileCheck,
      title: "4. Final Approval",
      description: "Once approved, we coordinate the final steps and handover.",
      details: ["Approval notification", "Final documentation", "Visa collection", "Support & guidance"]
    }
  ];

  return (
    <Layout>
      <div className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-6">
              Help me get a domestic worker
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              For the last 20 years we have been helping families in UAE get domestic workers from trusted sources, legally, safely and cost effectively. Here is a simple process of how we can help you achieve that
            </p>
          </div>

          {/* Process Steps */}
          <div className="space-y-12 mb-16">
            {steps.map((step, index) => (
              <div key={index} className={`flex flex-col lg:flex-row items-center gap-8 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                <div className="lg:w-1/2">
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover-lift">
                    <div className="flex items-center mb-6">
                      <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mr-4">
                        <step.icon className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold text-primary">{step.title}</h3>
                    </div>
                    <p className="text-gray-600 text-lg mb-6">{step.description}</p>
                    <ul className="space-y-3">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start">
                          {index === 0 || index === 1 ? (
                            <ChevronRight className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          )}
                          <span className="text-gray-700">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="lg:w-1/2">
                  <div className="bg-gradient-light rounded-2xl h-64 flex items-center justify-center overflow-hidden">
                    {index === 0 ? (
                      <img 
                        src={manThinking} 
                        alt="Person thinking about costs" 
                        className="w-full h-full object-cover"
                      />
                    ) : index === 1 ? (
                      <img 
                        src={crossroad} 
                        alt="Crossroad showing convenience and savings paths" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-8">
                        <div className="w-24 h-24 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-3xl font-bold text-primary">{index + 1}</span>
                        </div>
                        <p className="text-primary font-medium">Step {index + 1}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-16">
            <h2 className="text-3xl font-bold text-primary text-center mb-8">
              Typical Timeline
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h4 className="font-semibold text-primary mb-2">Day 1</h4>
                <p className="text-gray-600">Consultation & Documentation</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h4 className="font-semibold text-primary mb-2">Day 2-3</h4>
                <p className="text-gray-600">Apply initial approval and entry permit</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">3</span>
                </div>
                <h4 className="font-semibold text-primary mb-2">Day 4-5</h4>
                <p className="text-gray-600">Visa Position Amendment and EID and Medical Application</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-700">✓</span>
                </div>
                <h4 className="font-semibold text-primary mb-2">Day 6-10</h4>
                <p className="text-gray-600">Take the worker to do Medical, Biometric & Tawjeeh. Get Emirates ID at completion.</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-primary rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">We are all set, ready to start?</h2>
            <p className="text-xl text-primary-100 mb-6">
              Contact us today and let's begin your hassle-free visa process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3" onClick={() => {
                const message = "Hi! I'm ready to start my 2-year maid visa process. Can you help me?";
                window.open(`https://wa.me/971565822258?text=${encodeURIComponent(message)}`, '_blank');
              }}>
                WhatsApp Us Now
              </Button>
              <Button 
                variant="outline-white" 
                className="px-8 py-4 text-lg font-semibold transition-all duration-300"
                onClick={() => window.location.href = "tel:+971565822258"}
              >
                <Phone className="w-5 h-5 mr-3" />
                Call 0565822258 for help
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HowItWorks;
