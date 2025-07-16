
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
      question: "Can we pay when you get approval?",
      answer: "Absolutely, we can allow you to make payment after we receive the initial approval for your visa. Ask your sales agent."
    },
    {
      question: "Can I transfer my current maid's visa through TADVISAS?",
      answer: "Yes you can, but it's not a transfer, you need to cancel whatever visa you have with another provider, and provide us the required documents as above."
    },
    {
      question: "How long does the entire process take?",
      answer: "Typically, 7 to 12 working days from the time we receive all required documents. This includes medical tests, government processing, and Emirates ID. We keep you updated throughout the process. In some cases, if the system rejects the application for some requirements, you will be notified of the issue and the suggested remedies."
    },
    {
      question: "Do you handle medical examinations and Emirates ID?",
      answer: "We will take your worker to do the medical test and the Emirates ID biometric. There will always be a medical test, but if she has a recent Emirates ID, she may be exempted from biometric stamping. Either way, you can relax as we will take care of it."
    },
    {
      question: "What makes TADVISAS different from other providers?",
      answer: "The service itself is very standard as it is a governmental service with very small room for innovation, however, removing the extra cost, adding some value added service like chauffeuring the worker is something small but can differentiate the service. Please refer to a full list of comparison https://tadvisas.com/why-us"
    },
    {
      question: "Is there a guarantee if the visa gets rejected?",
      answer: "In the very unlikely event of visa rejection form the system of GDRFA, we offer a refund with a deduction of 600 Dhs."
    },
    {
      question: "Can I choose my domestic worker through TADVISAS?",
      answer: "Of course, we are first and foremost a domestic workers services center and we have workers of all nationalities. Please contact us on the what's app form and request for your preferred nationality."
    },
    {
      question: "What happens if a Domestic Worker Center Closes down?",
      answer: "In the unlikely event a center closes down, any center, MOHRE would have a contingency plan to make sure workers do not get affected. Also every center have a bank guarantee to make sure no workers left stranded or unattended for. Always remember these centers operate under very strict guidance from MOHRE and are monitored and almost daily."
    },
    {
      question: "What happens after the 2-year visa expires?",
      answer: "You can renew the visa for another 2 years through us. We'll contact you before expiry to start the renewal process. The renewal process is typically faster than the initial application. Or you can request us to cancel the maid visa and take her cancellation so she travel or change sponsorship."
    },
    {
      question: "Do you provide support after the visa is issued?",
      answer: "Yes, we provide ongoing support for any visa-related queries, renewals, and administrative needs. Our customer service team is available to help even after your visa is processed."
    },
    {
      question: "How does my maid get paid her salary?",
      answer: "We setup a direct debit through directdebit.ae a central bank licensed provider. Every agreed day of the month you send us the salary, and we pay the worker on the agreed pay day. usually all are processed before end of month. She has an ATM card with link to her account she can withdraw funds FREE from a RAKBANK ATM machine. Other machines may charge her small fees."
    },
    {
      question: "Can I cancel my Visa ANY TIME? Do I get a refund",
      answer: "Yes you can cancel your visa any time, and stop paying the monthly admin fees if any. You will not be charged exit fees. As the visa consist mainly of government fees, these are not refundable after processing the visa."
    },
    {
      question: "Do you have installments plan?",
      answer: "You bet! We have access to payments via Tabby and Tamara. Some fees may apply, please ask your visa expert from Tadvisas."
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
              <p className="text-gray-600">043551186</p>
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
