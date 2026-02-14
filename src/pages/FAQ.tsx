
import Layout from "@/components/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

const FAQ = () => {
  const sections = [
    {
      title: "Maid Visa Cost & Salary",
      faqs: [
        {
          question: "How much does a maid visa cost in Dubai?",
          answer: "The cost of sponsoring a maid in Dubai depends on the method you choose. There are generally two paths:\n\n• Personal sponsorship (do-it-yourself): Approximately AED 9,000 per year or around AED 15,500 for 2 years (government fees only, excluding optional services).\n\n• Through an accredited Tadbeer center like TADMAIDS: Approximately AED 9,000 for a 2-year visa, including multiple added services and benefits.\n\nUsing TADMAIDS not only reduces overall cost, but also ensures full compliance, faster processing, and added value services."
        },
        {
          question: "How much is a 2-year maid visa in the UAE?",
          answer: "A 2-year maid visa in the UAE typically costs around AED 15,000–16,000 if processed independently through government channels.\n\nHowever, through an accredited center like TADMAIDS, the total cost is approximately AED 9,000 for 2 years, including essential processing services and additional benefits.\n\nPrices may vary slightly depending on case specifics and nationality."
        },
        {
          question: "What is included in the maid visa cost?",
          answer: "Visa inclusions vary between service providers. At TADMAIDS, our 2-year maid visa package includes:\n\n• WPS salary processing setup\n• Bank account & salary card\n• ILOE insurance (Involuntary Loss of Employment coverage)\n• Emirates ID\n• Medical fitness test\n• Biometrics\n• Free chauffeur service for government procedures (exclusive to TADMAIDS)\n• Free NOC issuance for travel\n\nWe recommend comparing inclusions carefully, as some centers charge extra for services that we provide at no additional cost."
        },
        {
          question: "How much does it cost to sponsor a maid in the UAE?",
          answer: "If you sponsor a maid directly through government channels, the cost can reach approximately AED 15,500 for 2 years.\n\nWhen processed through TADMAIDS, the 2-year visa cost is approximately AED 9,000, with full documentation support and additional service benefits included.\n\nChoosing a licensed Tadbeer center ensures compliance and professional handling of the entire process."
        },
        {
          question: "How much does a nanny visa cost in Dubai?",
          answer: "A nanny visa falls under the domestic worker visa category and follows the same cost structure as a maid visa.\n\n• Personal sponsorship: approximately AED 15,000+ for 2 years\n• Through TADMAIDS: approximately AED 9,000 for 2 years including processing support and additional services\n\nFinal cost may vary based on the applicant's nationality and documentation requirements."
        },
        {
          question: "What is the salary of a housemaid in the UAE?",
          answer: "There is no fixed government salary guideline for domestic workers in the UAE. Salaries are generally determined by mutual agreement between the employer and the worker.\n\nHowever, for certain nationalities such as the Philippines, official minimum salary guidelines may apply. For example, Filipino domestic workers typically require a minimum salary of around USD 400 (approximately AED 1,500), as per their embassy regulations.\n\nIt is important to understand the difference between:\n\n• Salary – The net amount the worker receives monthly.\n• Monthly package payment – The total amount paid to a service provider under a flexible or monthly system.\n\nFor example, in a monthly package system, an employer may pay AED 2,800 per month for a Ugandan worker. The worker may receive AED 1,500 as salary, while the remaining amount covers visa costs, insurance, recruitment expenses, and administrative services.\n\nIn this case, AED 2,800 is not the worker's salary — it is the total service package amount."
        },
        {
          question: "What is the minimum salary required for a maid visa?",
          answer: "There is no fixed UAE government minimum salary requirement for most domestic workers.\n\nHowever, certain nationalities may have embassy-imposed minimum salary requirements. For example, Filipino domestic workers generally require a minimum salary of approximately AED 1,500 (USD 400).\n\nFor other nationalities, salary is typically based on agreement between employer and worker and current market demand."
        },
        {
          question: "How much should I pay my maid monthly?",
          answer: "Domestic worker salaries in the UAE are primarily based on supply and demand, experience, and nationality.\n\nAs long as both the employer and worker agree to the salary terms and it complies with applicable embassy requirements (if any), there is flexibility in determining the amount.\n\n⚠️ Important note:\nSome individuals may claim to hold a \"freelance\" domestic worker visa and request unusually high salaries (e.g., AED 3,500–4,000). In many cases, domestic workers are not legally permitted to freelance independently.\n\nBefore hiring any worker outside a licensed Tadbeer or sponsorship system, it is important to verify:\n\n• Who their legal sponsor is\n• Whether they are officially allowed to work\n• That their visa status is compliant\n\nEmployers are responsible for ensuring legal compliance to avoid fines or liability."
        },
        {
          question: "Is 3,000 AED a good salary for a maid in Dubai?",
          answer: "If AED 3,000 refers to the total monthly package cost (including visa, insurance, and recruitment costs), this is considered normal within certain monthly systems.\n\nIf AED 3,000 refers to the worker's net salary only, then it is generally above the market average for most nationalities.\n\nUltimately, salary levels depend on:\n\n• Experience\n• Nationality\n• Market demand\n• Scope of responsibilities\n\nEvery case should be evaluated individually."
        },
      ]
    },
    {
      title: "Process & Documentation",
      faqs: [
        {
          question: "What documents are required for the 2-year maid visa?",
          answer: "From the worker, we need Passport Copy, Cancellation (or entry permit if on visit visa) or Outpass (if exited during the Amnesty), clear passport quality Photo, Police Clearance Certificate for African nationalities (Excluding Ethiopia). From the Employer, Emirates ID, Ejari, & Dewa Bill. If anything else required we will contact you."
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
          question: "When do I need to pay for the maid visa?",
          answer: "Absolutely, we can allow you to make payment after we receive the initial approval for your visa. Ask your sales agent."
        },
        {
          question: "Can I transfer my current maid's visa through TADVISAS?",
          answer: "Yes you can, but it's not a transfer, you need to cancel whatever visa you have with another provider, and provide us the required documents as above."
        },
        {
          question: "How is a domestic worker salary paid in UAE?",
          answer: "We setup a direct debit through directdebit.ae a central bank licensed provider. Every agreed day of the month you send us the salary, and we pay the worker on the agreed pay day. usually all are processed before end of month. She has an ATM card with link to her account she can withdraw funds FREE from a RAKBANK ATM machine. Other machines may charge her small fees."
        },
        {
          question: "Do you provide support after the visa is issued?",
          answer: "Yes, we provide ongoing support for any visa-related queries, renewals, and administrative needs. Our customer service team is available to help even after your visa is processed."
        },
        {
          question: "What happens after the 2-year visa expires?",
          answer: "You can renew the visa for another 2 years through us. We'll contact you before expiry to start the renewal process. The renewal process is typically faster than the initial application. Or you can request us to cancel the maid visa and take her cancellation so she travel or change sponsorship."
        },
        {
          question: "Can I cancel my Visa ANY TIME? Do I get a refund",
          answer: "Yes you can cancel your visa any time, and stop paying the monthly admin fees if any. You will not be charged exit fees. As the visa consist mainly of government fees, these are not refundable after processing the visa."
        },
        {
          question: "Do you have installments plan?",
          answer: "You bet! We have access to payments via Tabby and Tamara. Some fees may apply, please ask your visa expert from Tadvisas."
        },
        {
          question: "Will my worker be able to travel with me any time?",
          answer: "Yes. We provide unlimited NOC (No objection certificate) so your worker can leave and enter the country freely with you."
        },
      ]
    },
    {
      title: "Tadbeer & Authority",
      faqs: [
        {
          question: "What is Tadbeer and how does it work?",
          answer: "Tadbeer is an initiative launched by the UAE Ministry of Human Resources and Emiratisation (MOHRE) to regulate the recruitment, sponsorship, and employment of domestic workers in the UAE.\n\nIt operates under strict government guidelines to ensure:\n\n• Protection of domestic workers\n• Protection of employers\n• Transparency in contracts and payments\n• Compliance with UAE labour regulations\n\nTadbeer itself is not a single shop or brand. It is a regulated activity licensed by MOHRE.\n\nThere are approximately 120+ licensed Tadbeer centers across the UAE. These centers are independently owned businesses that operate under MOHRE's system and regulatory framework.\n\nEach Tadbeer center may have its own brand name, but all licensed centers must follow the same government system for processing visas and domestic worker services."
        },
        {
          question: "Is Tadbeer a government company?",
          answer: "No. Tadbeer centers are privately owned companies.\n\nHowever, they operate under strict supervision and licensing by the UAE Ministry of Human Resources and Emiratisation (MOHRE).\n\nWhile the centers themselves are not government-owned, they are authorized to access official MOHRE systems to process domestic worker visas, contracts, and related services.\n\nThis ensures that all transactions are compliant with UAE law."
        },
        {
          question: "What is the difference between Tadbeer and private agencies?",
          answer: "In the UAE, domestic worker recruitment and sponsorship services must be conducted through licensed Tadbeer centers under MOHRE regulations.\n\nAny company offering recruitment or sponsorship services for domestic workers must be properly licensed and accredited under the Tadbeer framework.\n\nTadbeer centers operate under government oversight, standardized contracts, and regulated procedures — which protects both employers and workers.\n\nEmployers should always verify that the provider they deal with is officially licensed."
        },
        {
          question: "Is Tadmaids an official Tadbeer center?",
          answer: "Yes. TADMAIDS is an officially licensed and accredited Tadbeer center operating under the UAE Ministry of Human Resources and Emiratisation (MOHRE).\n\nClients can verify accredited Tadbeer centers through official MOHRE channels.\n\nAs a licensed center, we process domestic worker visas and services through the official MOHRE system in full compliance with UAE regulations."
        },
      ]
    },
    {
      title: "Other FAQs",
      faqs: [
        {
          question: "Can I choose my domestic worker through TADVISAS?",
          answer: "Of course, we are first and foremost a domestic workers services center and we have workers of all nationalities. Please contact us on the what's app form and request for your preferred nationality."
        },
        {
          question: "Is there a guarantee if the visa gets rejected?",
          answer: "In the very unlikely event of visa rejection form the system of GDRFA, we offer a refund with a deduction of 600 Dhs."
        },
        {
          question: "What makes TADVISAS different from other maid visa providers in Dubai?",
          answer: "The service itself is very standard as it is a governmental service with very small room for innovation, however, removing the extra cost, adding some value added service like chauffeuring the worker is something small but can differentiate the service. Please refer to a full list of comparison https://tadvisas.com/monthly-packages"
        },
        {
          question: "Can Tadmaids provide a maid if I don't already have one?",
          answer: "We can provide a maid of course of any and most nationalities but this comes at an extra fee. The fees are capped by MOHRE, the governing authority of Domestic Workers Centers like ours in UAE."
        },
        {
          question: "What happens if a Domestic Worker Center Closes down?",
          answer: "In the unlikely event a center closes down, any center, MOHRE would have a contingency plan to make sure workers do not get affected. Also every center have a bank guarantee to make sure no workers left stranded or unattended for. Always remember these centers operate under very strict guidance from MOHRE and are monitored and almost daily."
        },
      ]
    }
  ];

  return (
    <Layout>
      <div className="py-20 relative">
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

          {/* FAQ Sections */}
          <div className="mb-16 space-y-12">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h2 className="text-2xl font-bold text-primary mb-6">{section.title}</h2>
                <Accordion type="single" collapsible className="space-y-4">
                  {section.faqs.map((faq, faqIndex) => (
                    <AccordionItem key={faqIndex} value={`section-${sectionIndex}-item-${faqIndex}`} className="bg-white rounded-lg shadow-md border-0">
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
            ))}
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
                window.open(`https://wa.me/971567222248?text=${encodeURIComponent(message)}`, '_blank');
              }}>
                Ask on WhatsApp
              </Button>
              <Button 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary hover:text-white px-8 py-4 text-lg font-semibold transition-all duration-300"
                onClick={() => {
                  // Track phone call click conversion
                  if ((window as any).gtag) {
                    (window as any).gtag('event', 'conversion', {
                      'send_to': 'AW-17128942210',
                      'event_category': 'call',
                      'event_label': 'faq_call'
                    });
                  }
                  window.location.href = "tel:+971567222248";
                }}
              >
                <Phone className="w-5 h-5 mr-3" />
                Call 0567222248 for help
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
              <p className="text-gray-600">+971567222248</p>
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
              <p className="text-gray-600">tadbeer@tadmaids.com</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FAQ;
