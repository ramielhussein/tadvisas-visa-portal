import { useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Phone, MessageCircle, CheckCircle, Shield, DollarSign, FileText, Car, ChevronRight } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/971567222248";
const PHONE = "+971567222248";

const faqs = [
  {
    question: "How much does a maid visa cost in Dubai?",
    answer: "Through TADMAIDS, the 2-year maid visa costs approximately AED 9,000 — including WPS setup, Emirates ID, medical test, biometrics, ILOE insurance, bank account, and free chauffeur service. Personal sponsorship through government channels costs approximately AED 15,500 for 2 years."
  },
  {
    question: "What is included in the maid visa cost?",
    answer: "Our package includes: WPS salary processing setup, bank account & salary card, ILOE insurance, Emirates ID, medical fitness test, biometrics, free chauffeur service for government procedures (exclusive to TADMAIDS), and free NOC issuance for travel."
  },
  {
    question: "Can I pay after visa approval?",
    answer: "Yes — we can allow you to make payment after we receive the initial approval for your visa. Ask your sales agent for details."
  },
  {
    question: "Do you offer installment plans?",
    answer: "Yes! We offer payments via Tabby and Tamara. Some fees may apply — please ask your visa expert from TADVISAS."
  },
  {
    question: "Is there a guarantee if the visa gets rejected?",
    answer: "In the very unlikely event of visa rejection from the GDRFA system, we offer a refund with a deduction of AED 600."
  },
];

const MaidVisaCostDubai = () => {
  useEffect(() => {
    document.title = "Maid Visa Cost in Dubai 2025 – AED 9,000 for 2 Years | TADMAIDS";
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Maid visa cost in Dubai starts at AED 9,000 for 2 years through TADMAIDS. Includes Emirates ID, medical, insurance, WPS & free chauffeur. Compare costs and save.");

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
    el.id = "jsonld-maid-visa-cost";
    el.type = "application/ld+json";
    el.textContent = JSON.stringify(faqJsonLd);
    document.head.appendChild(el);
    return () => { document.getElementById("jsonld-maid-visa-cost")?.remove(); };
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
            Maid Visa Cost in Dubai – How Much Does It Really Cost?
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Get a 2-year maid visa for approximately AED 9,000 through TADMAIDS — nearly half the cost of personal sponsorship.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" onClick={() => window.open(WHATSAPP_URL, "_blank")}>
              <MessageCircle className="mr-2 h-5 w-5" /> Get a Quote on WhatsApp
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => window.open(`tel:${PHONE}`)}>
              <Phone className="mr-2 h-5 w-5" /> Call Now
            </Button>
          </div>
        </div>
      </section>

      {/* Cost Comparison */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Maid Visa Cost Comparison: DIY vs. TADMAIDS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-muted/50 rounded-xl p-6 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-6 w-6 text-destructive" />
                <h3 className="text-xl font-semibold">Personal Sponsorship (DIY)</h3>
              </div>
              <p className="text-3xl font-bold text-destructive mb-2">~AED 15,500</p>
              <p className="text-muted-foreground text-sm mb-4">for 2 years (government fees only)</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Government fees only — no added services</li>
                <li>• You handle all paperwork yourself</li>
                <li>• Multiple trips to government offices</li>
                <li>• No chauffeur or support included</li>
              </ul>
            </div>
            <div className="bg-primary/5 rounded-xl p-6 border-2 border-primary">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold">Through TADMAIDS</h3>
              </div>
              <p className="text-3xl font-bold text-primary mb-2">~AED 9,000</p>
              <p className="text-muted-foreground text-sm mb-4">for 2 years — all-inclusive</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• WPS, Emirates ID, medical, biometrics included</li>
                <li>• ILOE insurance & bank account setup</li>
                <li>• Free chauffeur for government procedures</li>
                <li>• Free NOC issuance for travel</li>
              </ul>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            The cost of sponsoring a maid in Dubai depends on whether you choose personal sponsorship or go through an accredited Tadbeer center like TADMAIDS. Personal sponsorship requires approximately AED 9,000 per year or around AED 15,500 for 2 years in government fees alone — excluding optional services and without any support.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Through TADMAIDS, the total cost for a 2-year visa is approximately AED 9,000, which includes multiple added services such as WPS salary processing, bank account setup, ILOE insurance, Emirates ID, medical fitness tests, biometrics, free chauffeur service for all government procedures, and free NOC issuance for travel.
          </p>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-14 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">What's Included in Our Maid Visa Package?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: FileText, title: "WPS Salary Processing", desc: "Full Wage Protection System setup for compliant salary payments" },
              { icon: DollarSign, title: "Bank Account & Salary Card", desc: "Worker gets a RAKBANK ATM card for free withdrawals" },
              { icon: Shield, title: "ILOE Insurance", desc: "Involuntary Loss of Employment coverage included" },
              { icon: FileText, title: "Emirates ID & Medical", desc: "Complete medical fitness test and biometric processing" },
              { icon: Car, title: "Free Chauffeur Service", desc: "We drive your worker to all government procedures — exclusive to TADMAIDS" },
              { icon: FileText, title: "Free NOC Issuance", desc: "Unlimited No Objection Certificates so your worker can travel freely" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-card rounded-lg p-4 border border-border">
                <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-6 text-sm">
            We recommend comparing inclusions carefully — some centers charge extra for services that TADMAIDS provides at no additional cost.
          </p>
        </div>
      </section>

      {/* Nanny Visa */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">How Much Does a Nanny Visa Cost in Dubai?</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              A nanny visa falls under the domestic worker visa category and follows the same cost structure as a maid visa. Through personal sponsorship, expect approximately AED 15,000+ for 2 years. Through TADMAIDS, the cost is approximately AED 9,000 for 2 years including all processing support and additional services.
            </p>
            <p>
              Final cost may vary based on the applicant's nationality and documentation requirements. Contact us on WhatsApp for a precise quote based on your situation.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Frequently Asked Questions About Maid Visa Costs</h2>
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
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Get Your Maid Visa?</h2>
          <p className="text-lg opacity-90 mb-8">Save thousands compared to DIY sponsorship. Get started with TADMAIDS today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" onClick={() => window.open(WHATSAPP_URL, "_blank")}>
              <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp Us Now
            </Button>
            <Link to="/faq">
              <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                View Full FAQ <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default MaidVisaCostDubai;
