
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { FileText, ArrowDownToLine, Cog, FileCheck, Users, CheckCircle, Phone, ChevronRight, DollarSign, HelpCircle, MessageCircle } from "lucide-react";
import manThinking from "@/assets/man-thinking-2.png";
import crossroad from "@/assets/crossroad.png";
import choices from "@/assets/choices.png";
import maidChildParent from "@/assets/maid-child-parent.png";

const HowItWorks = () => {
  const steps = [
    {
      icon: DollarSign,
      title: "1. Yes! Money Matters!",
      description: "💡 Know Before You Decide",
      details: [
        "Government-capped fees per nationality:",
        "• Philippines / India / Myanmar → AED 12,600",
        "• Ethiopia → AED 5,250",
        "• Uganda / Kenya → AED 6,825",
        "• Indonesia / Sri Lanka → AED 15,750",
        "",
        "Visa & salary not included. Prefer all-in-one? 👉 Check Monthly Packages."
      ]
    },
    {
      icon: HelpCircle,
      title: "2. Path Options",
      description: "💰 Save Big or Go Hassle-Free — The Choice Is Yours",
      details: [
        "• Savings Plan: Take the visa yourself, pay a smaller salary, and save up to AED 25,000 in 2 years.",
        "• Convenience Plan: One monthly fee covers everything — visa, salary, insurance, fees."
      ]
    },
    {
      icon: Cog,
      title: "3. What do you need?",
      description: "🏡 Your Home, Your Rules",
      details: [
        "Babies, pets, cooking, or full support — tell us what matters most, and we'll match you with the right worker."
      ]
    },
    {
      icon: MessageCircle,
      title: "4. Start the Process",
      description: "🚀 Getting Started Is Simple",
      details: [
        "Click our WhatsApp link and tell us:",
        "• Worker's nationality",
        "• Main tasks",
        "• Skills, age, or experience you prefer",
        "",
        "🔒 Worker profiles are shared privately to protect confidentiality."
      ]
    }
  ];

  return (
    <Layout>
      <div className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-6">
              Planning To Get A Domestic Worker
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
                    {index === 0 ? (
                      // Special formatting for section 1 - Money Matters
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                        <ul className="space-y-2">
                          {step.details.map((detail, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-gray-700">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : index === 1 || index === 2 || index === 3 ? (
                      // Special formatting for sections 3 and 4 - with blue box
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                        <ul className="space-y-2">
                          {step.details.map((detail, idx) => (
                            <li key={idx} className={`flex items-start ${index === 3 && idx >= 4 && idx <= 6 ? 'ml-8' : ''}`}>
                              <span className="text-gray-700">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start">
                            {index === 0 || index === 1 || index === 2 || index === 3 ? (
                              <ChevronRight className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            )}
                            <span className="text-gray-700">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    )}
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
                    ) : index === 2 ? (
                      <img 
                        src={choices} 
                        alt="Choices, beliefs and diet directional signs" 
                        className="w-full h-full object-cover"
                      />
                    ) : index === 3 ? (
                      <img 
                        src={maidChildParent} 
                        alt="Domestic worker playing with child and parent" 
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
                <h4 className="font-semibold text-primary mb-2">Day 1: Interviews</h4>
                <p className="text-gray-600">Meet Your Match 👩‍👩‍👧<br/>View candidates and interview by phone, video, or in person — at your convenience.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h4 className="font-semibold text-primary mb-2">Day 2 to 5: Trial & Fit</h4>
                <p className="text-gray-600">A Perfect Start 🤝<br/>Your worker joins your home — both sides make sure it's the right fit.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">3</span>
                </div>
                <h4 className="font-semibold text-primary mb-2">Day 6-18: Visa & Legalities</h4>
                <p className="text-gray-600">We Handle the Paperwork 📝<br/>Once you're confident, we'll take care of the visa and all legal requirements.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-700">✓</span>
                </div>
                <h4 className="font-semibold text-primary mb-2">Two Years</h4>
                <p className="text-gray-600">Enjoy peace of mind and a clean, organized home with your dedicated domestic worker.</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-primary rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">We are all set, ready to start?</h2>
            <p className="text-xl text-primary-100 mb-6">
              Contact us today and let's begin your hassle-free maid hiring process.
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
