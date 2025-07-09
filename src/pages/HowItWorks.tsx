
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { FileText, Search, Cog, FileCheck, Users, CheckCircle, Phone } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: Search,
      title: "1. Initial Consultation",
      description: "Contact us via WhatsApp or phone. We'll discuss your requirements and explain the entire process.",
      details: ["Free consultation, Will ask about your maid's status and documents availability", "Requirement assessment", "Process explanation, this takes a bit of time, will explain every step and how long it takes.", "Timeline discussion"]
    },
    {
      icon: FileText,
      title: "2. Documentation Collection",
      description: "We collect all necessary documents from you and your domestic worker in 2 minutes. Email or WhatsApp them and off we go.",
      details: ["Passport copies", "Entry permit or cancellation", "A clear passport quality photo", "Your Emirates ID and Dewa Bill"]
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
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-6">
              How It Works
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our streamlined 4-step process makes getting your 2-year maid visa simple, 
              transparent, and hassle-free. We handle everything so you don't have to.
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
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="lg:w-1/2">
                  <div className="bg-gradient-light rounded-2xl p-8 h-64 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl font-bold text-primary">{index + 1}</span>
                      </div>
                      <p className="text-primary font-medium">Step {index + 1}</p>
                    </div>
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
