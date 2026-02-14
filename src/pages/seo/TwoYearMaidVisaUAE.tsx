import { useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Phone, MessageCircle, CheckCircle, Shield, Clock, FileText, ChevronRight } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/971567222248";
const PHONE = "+971567222248";

const faqs = [
  {
    question: "How much is a 2-year maid visa in the UAE?",
    answer: "A 2-year maid visa in the UAE typically costs around AED 15,000–16,000 if processed independently. Through TADMAIDS, the total cost is approximately AED 9,000 for 2 years, including essential processing services and additional benefits."
  },
  {
    question: "What documents are required for the 2-year maid visa?",
    answer: "From the worker: Passport copy, cancellation (or entry permit if on visit visa), passport-quality photo, Police Clearance Certificate for African nationalities (excluding Ethiopia). From the employer: Emirates ID, Ejari, & DEWA bill."
  },
  {
    question: "How long does the entire process take?",
    answer: "Typically 7 to 12 working days from when we receive all required documents. This includes medical tests, government processing, and Emirates ID. We keep you updated throughout."
  },
  {
    question: "Do you handle medical examinations and Emirates ID?",
    answer: "Yes — we take your worker for the medical test and Emirates ID biometric. If she has a recent Emirates ID, she may be exempted from biometric stamping. Either way, we take care of it."
  },
  {
    question: "What happens after the 2-year visa expires?",
    answer: "You can renew the visa for another 2 years through us. We'll contact you before expiry to start the renewal process. The renewal is typically faster than the initial application."
  },
  {
    question: "Can I cancel my visa any time?",
    answer: "Yes — you can cancel your visa any time and stop paying monthly admin fees. You will not be charged exit fees. Government fees are not refundable after processing."
  },
];

const TwoYearMaidVisaUAE = () => {
  useEffect(() => {
    document.title = "2-Year Maid Visa UAE – Process, Cost & Documents | TADMAIDS";
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Complete guide to the 2-year maid visa in the UAE. AED 9,000 through TADMAIDS. Documents, timeline, medical, renewal & cancellation explained.");

    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(f => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": { "@type": "Answer", "text": f.answer }
      }))
    };
    const el = document.createElement("script");
    el.id = "jsonld-2yr-visa";
    el.type = "application/ld+json";
    el.textContent = JSON.stringify(faqJsonLd);
    document.head.appendChild(el);
    return () => { document.getElementById("jsonld-2yr-visa")?.remove(); };
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-16 md:py-24">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 px-4 py-1.5 rounded-full mb-6">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Licensed Tadbeer Center</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight">
            2-Year Maid Visa in the UAE – Complete Guide
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Everything you need to know about the 2-year domestic worker visa — cost, documents, timeline, and what's included.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" onClick={() => window.open(WHATSAPP_URL, "_blank")}>
              <MessageCircle className="mr-2 h-5 w-5" /> Start Your Visa on WhatsApp
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => window.open(`tel:${PHONE}`)}>
              <Phone className="mr-2 h-5 w-5" /> Call Now
            </Button>
          </div>
        </div>
      </section>

      {/* Process Timeline */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">How the 2-Year Maid Visa Process Works</h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Submit Documents", desc: "Provide passport copy, photo, and cancellation from the worker. Emirates ID, Ejari & DEWA bill from the employer.", time: "Day 1" },
              { step: "2", title: "Initial Approval", desc: "We submit your application through the official MOHRE system. You can choose to pay after initial approval is received.", time: "Day 2-3" },
              { step: "3", title: "Medical & Biometrics", desc: "We take your worker for the medical fitness test and Emirates ID biometric stamping. Our free chauffeur handles all transport.", time: "Day 4-7" },
              { step: "4", title: "Visa Stamping", desc: "Final visa processing and stamping. WPS salary setup, bank account creation, and ILOE insurance activated.", time: "Day 7-12" },
              { step: "5", title: "Handover & Support", desc: "You receive the completed visa with all documents. Ongoing support for renewals, NOCs, and administrative needs.", time: "Complete" },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0">{item.step}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{item.time}</span>
                  </div>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Documents Required */}
      <section className="py-14 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Documents Required for the 2-Year Maid Visa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> From the Worker</h3>
              <ul className="space-y-3">
                {["Passport copy", "Cancellation or entry permit (if on visit visa)", "Outpass (if exited during Amnesty)", "Clear passport-quality photo", "Police Clearance Certificate (African nationalities, excluding Ethiopia)"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> From the Employer</h3>
              <ul className="space-y-3">
                {["Emirates ID", "Ejari (tenancy contract)", "DEWA bill"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* After Visa */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">After Your 2-Year Visa Is Issued</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>Once your visa is processed, we provide ongoing support including:</p>
            <ul className="space-y-2 list-none pl-0">
              {[
                "Unlimited NOC (No Objection Certificate) issuance for travel",
                "Visa renewal reminders before expiry",
                "Cancellation processing when needed — no exit fees",
                "WPS salary management through direct debit",
                "Customer service support for any visa-related queries",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p>
              You can cancel your visa at any time without exit fees. As the visa consists mainly of government fees, these are not refundable after processing.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Frequently Asked Questions About the 2-Year Visa</h2>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border rounded-lg px-4">
                <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 md:py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Start Your 2-Year Maid Visa Today</h2>
          <p className="text-lg opacity-90 mb-8">7–12 working days from document submission to visa completion. Let's get started.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" onClick={() => window.open(WHATSAPP_URL, "_blank")}>
              <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp Us Now
            </Button>
            <Link to="/maid-visa-cost-dubai">
              <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                See Full Cost Breakdown <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default TwoYearMaidVisaUAE;
