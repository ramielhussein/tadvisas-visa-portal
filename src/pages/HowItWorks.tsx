
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
      title: "1. Path Options",
      description: "",
      details: [
        "Path 1 – Big Savings 💰",
        "Cut costs and save up to AED 25,000 in 2 years. Take on the visa and salary yourself, and keep expenses low. Smart but comes with risk.",
        "",
        "Path 2 – All-Inclusive Convenience ✨",
        "One fixed monthly fee. Salary, visa, insurance, and fees all covered. Simple. Hassle-free. Peace of mind."
      ]
    },
    {
      icon: Cog,
      title: "2. Worker Preferences",
      description: "Your Home, Your Choice 🏡",
      details: [
        "Need an all-around helper? Infant care? Pet care? Cooking? Experience or trainable?",
        "Tell us what matters most — and we'll match you with the right worker."
      ]
    },
    {
      icon: HelpCircle,
      title: "3. Fees & Costs",
      description: "Know the Real Costs 🔍",
      details: [
        "• Philippines / India / Myanmar → AED 12,600",
        "• Ethiopia → AED 5,250",
        "• Uganda / Kenya → AED 6,825",
        "• Indonesia / Sri Lanka → AED 15,750",
        "",
        "These fees are set by MOHRE and are separate from visa & salary.",
        "👉 Prefer one fixed monthly fee? See Monthly Packages."
      ]
    },
    {
      icon: MessageCircle,
      title: "4. Start the Process",
      description: "Your Next Step 🚀",
      details: [
        "Click the WhatsApp link and tell us:",
        "• Nationality",
        "• Main tasks",
        "• Age, skills, experience",
        "",
        "🔒 Worker biodata is shared privately for confidentiality."
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
                      // Special formatting for Path Options
                      <div className="space-y-4">
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                          <h4 className="font-bold text-blue-700 mb-3">{step.details[0]}</h4>
                          <p className="text-gray-700">{step.details[1]}</p>
                        </div>
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                          <h4 className="font-bold text-blue-700 mb-3">{step.details[3]}</h4>
                          <p className="text-gray-700">{step.details[4]}</p>
                        </div>
                      </div>
                    ) : index === 1 || index === 2 ? (
                      // Special formatting for Worker Preferences and Fees & Costs
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                        <ul className="space-y-2">
                          {step.details.map((detail, idx) => (
                            detail && (
                              <li key={idx} className="text-gray-700">
                                {detail}
                              </li>
                            )
                          ))}
                        </ul>
                      </div>
                    ) : index === 3 ? (
                      // Special formatting for Start the Process
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                        <ul className="space-y-2">
                          {step.details.map((detail, idx) => (
                            detail && (
                              <li key={idx} className={`text-gray-700 ${idx >= 1 && idx <= 3 ? 'ml-8' : ''}`}>
                                {detail}
                              </li>
                            )
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start">
                            <ChevronRight className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
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
              Your Journey Timeline
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">5</span>
                </div>
                <h4 className="font-semibold text-primary mb-2">Interviews</h4>
                <h5 className="text-lg font-medium text-gray-800 mb-2">Meet Your Match 👩‍👩‍👧</h5>
                <p className="text-gray-600">View candidates and interview by phone, video, or in person — at your convenience.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">6</span>
                </div>
                <h4 className="font-semibold text-primary mb-2">Trial & Fit</h4>
                <h5 className="text-lg font-medium text-gray-800 mb-2">A Perfect Start 🤝</h5>
                <p className="text-gray-600">Your worker joins your home — both sides make sure it's the right fit.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">7</span>
                </div>
                <h4 className="font-semibold text-primary mb-2">Visa & Legalities</h4>
                <h5 className="text-lg font-medium text-gray-800 mb-2">We Handle the Paperwork 📝</h5>
                <p className="text-gray-600">Once you're confident, we'll take care of the visa and all legal requirements.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-700">8</span>
                </div>
                <h4 className="font-semibold text-primary mb-2">Peace of Mind</h4>
                <h5 className="text-lg font-medium text-gray-800 mb-2">Relax. We've Got You Covered 🌟</h5>
                <p className="text-gray-600">Enjoy a clean, organized home and total peace of mind with your dedicated worker.</p>
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
