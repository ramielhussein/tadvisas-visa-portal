
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
      description: "If you have a worker and want a visa, you are saving money, if you need a worker you have to consider that there are additional significant fees involved.",
      details: [
        "The maid fees capped by MOHRE start from AED 5250 all the way to AED 15750 for workers depend on the nationality. Here is the most common ones",
        "Philippines, India, Myanmar AED 12600 | Ethiopia AED 5250, Uganda Kenya AED 6825 | Indonesia Sri Lanka AED 15750",
        "Please remember these costs are on top of any visa fees or salary. If you actually prefer or want a Monthly Inclusive package please check the section Monthly Packages."
      ]
    },
    {
      icon: HelpCircle,
      title: "2. Think of the path to follow",
      description: "If you do not have a worker and want one, then you actually want multiple services all at a cost, you need to decide how to go",
      details: [
        "Path 1 – Save More (But With Risk)\n\t•\tPay our fees → Get a worker → Get the visa.\n\t•\tYou can sponsor the visa yourself or through us.\n\t•\tAdd medical insurance.\n\t•\tPay only the worker's monthly salary (much lower).\n\t•\tOver 2 years, you save AED 15,000–25,000.\n⚠️ Risk: If the worker leaves, we can replace the worker, but not the visa cost.",
        "Path2- Convenience comes with a price. We will be happy to give you a worker on a monthly fixed fee. Pay one time per month inclusive of Worker Salary, Visa, insurance, and our fees. Overall you will be paying more over a 2 years contract but your risk will always be limited to the month you are in and we will happily replace the worker unlimited amount of times. Tough choice!"
      ]
    },
    {
      icon: Cog,
      title: "3. What do you need",
      description: "You have established that you need a worker from us and ready to move on, not very happy but you must do what you must do",
      details: [
        "It is important to tell us what you want the worker for, is she an all around, would she be looking after babies? Infants? Pets?",
        "Does she need to cook? Does she have to be of a of particular religion or have specific dietary needs (eg: vegan)",
        "Do you have time to teach or you prefer an experienced one?",
        "Remember you can wish for anything but the more you wish for the harder the task. Think of what matters to you and your family most."
      ]
    },
    {
      icon: MessageCircle,
      title: "4. Let's start the journey",
      description: "If you have your wishlist and you know what you want it is time you talk to us.",
      details: [
        "First click on the what's app link and tell us what u need and how you need to do it.",
        "Nationality of worker",
        "Main Tasks",
        "Any consideration to age, skills experience",
        "To respect the privacy of the workers we do not publish workers biodata, please ask for them on a private message.",
        "Talk to you soon."
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
                <h4 className="font-semibold text-primary mb-2">Day 1</h4>
                <p className="text-gray-600">Talk to us, view candidates and do online or phone or in-person interviews.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h4 className="font-semibold text-primary mb-2">Day 2-5</h4>
                <p className="text-gray-600">Worker will join your home, and you will both make sure that it works for both of you.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">3</span>
                </div>
                <h4 className="font-semibold text-primary mb-2">Day 6-18</h4>
                <p className="text-gray-600">Now that you are sure this is the right fit for you we will do the visa and make sure of all the legalities in place.</p>
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
