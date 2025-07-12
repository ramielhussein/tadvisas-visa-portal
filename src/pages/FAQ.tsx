
import Layout from "@/components/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

const FAQ = () => {
  const faqs = [
    {
      question: "What documents are required for the 2-year maid visa?",
      answer: "From the worker, we need Passport Copy, Cancellation (or entry permit if on visit visa) or Outpass (if exited during the Amnesty), clear passport quality Photo, Police Clearance Certificate for African nationalities (Excluding Ethiopia). From the Employer, Emirates ID, Ejari, & Dewa Bill. If anything else required we will contact you."
    },
    {
      question: "Can I transfer my current maid's visa through TADVISAS?",
      answer: "Yes you can, but it's not a transfer, you need to cancel whatever visa you have with another provider, and provide us the required documents as above."
    },
    {
      question: "How long does the entire process take?",
      answer: "Typically 15-21 working days from the time we receive all required documents. This includes medical tests, government processing, and Emirates ID. We keep you updated throughout the process."
    },
    {
      question: "Do you handle medical examinations and Emirates ID?",
      answer: "Yes, we coordinate all medical examinations at approved centers and handle the Emirates ID application process. This is included in our service fee with no additional charges."
    },
    {
      question: "What makes TADVISAS different from other providers?",
      answer: "We charge ZERO monthly admin fees, are 100% Tadbeer licensed, offer transparent pricing, and provide complete support. Many others charge 200-500 AED monthly which adds up to thousands over 2 years."
    },
    {
      question: "Is there a guarantee if the visa gets rejected?",
      answer: "We have a 99.9% approval rate due to our thorough documentation process. In the rare case of rejection due to our error, we offer a full refund. Rejections due to false information provided by clients are not covered."
    },
    {
      question: "Can I choose my domestic worker through TADVISAS?",
      answer: "Yes, we have an extensive network of qualified domestic workers from various nationalities. We can help you find the right person based on your requirements, or process the visa for someone you've already chosen."
    },
    {
      question: "What are the costs involved and are there any hidden fees?",
      answer: "Our pricing is completely transparent and varies by nationality (3,200-3,800 AED). This includes ALL government fees, medical tests, Emirates ID, and our service fee. We charge ZERO monthly admin fees unlike others."
    },
    {
      question: "What happens after the 2-year visa expires?",
      answer: "You can renew the visa for another 2 years through us. We'll contact you before expiry to start the renewal process. The renewal process is typically faster than the initial application."
    },
    {
      question: "Do you provide support after the visa is issued?",
      answer: "Yes, we provide ongoing support for any visa-related queries, renewals, and administrative needs. Our customer service team is available to help even after your visa is processed."
    }
  ];

  return (
    <Layout>
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600">
              Find answers to the most common questions about our 2-year maid visa service. 
              If you can't find what you're looking for, feel free to contact us directly.
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="mb-16">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="bg-white rounded-lg shadow-md border-0">
                  <AccordionTrigger className="text-left text-lg font-semibold text-primary hover:text-primary-700 px-6 py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 px-6 pb-4 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Still Have Questions */}
          <div className="bg-gradient-light rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-bold text-primary mb-4">
              Still Have Questions?
            </h2>
            <p className="text-xl text-gray-600 mb-6">
              Our customer service team is ready to help you with any additional questions 
              about our 2-year maid visa service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3" onClick={() => {
                const message = "Hi! I have a question about your 2-year maid visa service. Can you help me?";
                window.open(`https://wa.me/971565822258?text=${encodeURIComponent(message)}`, '_blank');
              }}>
                Ask on WhatsApp
              </Button>
              <Button 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary hover:text-white px-8 py-4 text-lg font-semibold transition-all duration-300"
                onClick={() => window.location.href = "tel:+971565822258"}
              >
                <Phone className="w-5 h-5 mr-3" />
                Call 0565822258 for help
              </Button>
            </div>
          </div>

          {/* Quick Contact Info */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center bg-white rounded-xl p-6 shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-xl">📱</span>
              </div>
              <h3 className="font-semibold text-primary mb-2">WhatsApp</h3>
              <p className="text-gray-600">+971565822258</p>
            </div>
            <div className="text-center bg-white rounded-xl p-6 shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-xl">📞</span>
              </div>
              <h3 className="font-semibold text-primary mb-2">Phone</h3>
              <p className="text-gray-600">+971 50 123 4567</p>
            </div>
            <div className="text-center bg-white rounded-xl p-6 shadow-md">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 text-xl">📧</span>
              </div>
              <h3 className="font-semibold text-primary mb-2">Email</h3>
              <p className="text-gray-600">info@tadvisas.com</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FAQ;
