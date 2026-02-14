import { useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Phone, MessageCircle, CheckCircle, Shield, AlertTriangle, Building2, FileText, Users, ChevronRight } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/971567222248";
const PHONE = "+971567222248";

const faqs = [
  {
    question: "What is Tadbeer and how does it work?",
    answer: "Tadbeer is a government-regulated initiative by MOHRE to regulate domestic worker recruitment and employment in the UAE. There are 120+ licensed centers across the UAE — independently owned businesses operating under MOHRE's system. Each center follows the same government system for processing visas and domestic worker services."
  },
  {
    question: "Is Tadbeer a government company?",
    answer: "No. Tadbeer centers are privately owned companies that operate under strict supervision and licensing by MOHRE. They are authorized to access official MOHRE systems for processing domestic worker visas, contracts, and related services, ensuring full compliance with UAE law."
  },
  {
    question: "What is the difference between Tadbeer and private agencies?",
    answer: "All domestic worker recruitment and sponsorship in the UAE must be conducted through licensed Tadbeer centers under MOHRE regulations. Tadbeer centers operate under government oversight with standardized contracts and regulated procedures — protecting both employers and workers."
  },
  {
    question: "Is Tadmaids an official Tadbeer center?",
    answer: "Yes. TADMAIDS is an officially licensed and accredited Tadbeer center operating under MOHRE. Clients can verify accredited centers through official MOHRE channels. We process all domestic worker visas through the official MOHRE system in full compliance."
  },
  {
    question: "Can expats sponsor a maid without Tadbeer?",
    answer: "Expats can sponsor on their own file, but the cost will be at least double what it costs through a Tadbeer center. The documentation burden is also significant — bank statements, salary certificates, Ejari, marriage certificates, proof of a 2-bedroom house, and more."
  },
];

const comparisonRows = [
  { feature: "MOHRE Licensed", tadbeer: "✓ Yes", informal: "✗ Often not" },
  { feature: "Standardized Contracts", tadbeer: "✓ Government-regulated", informal: "✗ Variable" },
  { feature: "Worker Protection", tadbeer: "✓ Full legal framework", informal: "✗ Limited" },
  { feature: "Refund Policies", tadbeer: "✓ Defined by regulation", informal: "✗ Unclear" },
  { feature: "Bank Guarantee", tadbeer: "✓ Required by MOHRE", informal: "✗ None" },
  { feature: "Dispute Mediation", tadbeer: "✓ Government support", informal: "✗ No recourse" },
];

const WhatIsTadbeer = () => {
  useEffect(() => {
    document.title = "What Is Tadbeer? UAE Domestic Worker System Explained | TADMAIDS";
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "What is Tadbeer? Learn how the UAE's MOHRE-regulated domestic worker center system works. 120+ licensed centers. Compare Tadbeer vs private agencies vs DIY sponsorship.");

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
    el.id = "jsonld-what-tadbeer";
    el.type = "application/ld+json";
    el.textContent = JSON.stringify(faqJsonLd);
    document.head.appendChild(el);
    return () => { document.getElementById("jsonld-what-tadbeer")?.remove(); };
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-16 md:py-24">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 px-4 py-1.5 rounded-full mb-6">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Government-Regulated System</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight">
            What Is Tadbeer? UAE's Domestic Worker Center System
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Everything you need to know about Tadbeer — the UAE's regulated framework for domestic worker services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" onClick={() => window.open(WHATSAPP_URL, "_blank")}>
              <MessageCircle className="mr-2 h-5 w-5" /> Contact Our Tadbeer Center
            </Button>
          </div>
        </div>
      </section>

      {/* What Is Tadbeer */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Understanding the Tadbeer System</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              Tadbeer is an initiative launched by the <strong>UAE Ministry of Human Resources and Emiratisation (MOHRE)</strong> to regulate the recruitment, sponsorship, and employment of domestic workers across the UAE.
            </p>
            <p>It operates under strict government guidelines to ensure:</p>
            <ul className="space-y-2 list-none pl-0">
              {[
                "Protection of domestic workers' rights",
                "Protection of employers' interests",
                "Transparency in contracts and payments",
                "Compliance with UAE labour regulations",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p>
              Tadbeer itself is <strong>not a single shop or brand</strong>. It is a regulated activity licensed by MOHRE. There are approximately <strong>120+ licensed Tadbeer centers</strong> across the UAE — independently owned businesses that operate under MOHRE's system and regulatory framework.
            </p>
            <p>
              Each center may have its own brand name, but all licensed centers must follow the same government system for processing visas and domestic worker services.
            </p>
          </div>
        </div>
      </section>

      {/* Is Tadbeer Government? */}
      <section className="py-14 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Is Tadbeer a Government Company?</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              <strong>No.</strong> Tadbeer centers are privately owned companies. However, they operate under strict supervision and licensing by MOHRE.
            </p>
            <p>
              While the centers themselves are not government-owned, they are authorized to access official MOHRE systems to process domestic worker visas, contracts, and related services. This ensures that all transactions are compliant with UAE law.
            </p>
            <p>
              Every center is required to maintain a <strong>bank guarantee</strong> with MOHRE to ensure no workers are left unattended. Centers are monitored regularly and must adhere to strict operational standards.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Licensed Tadbeer Center vs. Informal Agency</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-3 px-4 font-semibold">Feature</th>
                  <th className="text-left py-3 px-4 font-semibold">
                    <span className="inline-flex items-center gap-2 text-primary">
                      <Shield className="h-4 w-4" /> Licensed Tadbeer
                    </span>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">
                    <span className="inline-flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4" /> Informal Agency
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-3 px-4 font-medium">{row.feature}</td>
                    <td className="py-3 px-4 text-primary">{row.tadbeer}</td>
                    <td className="py-3 px-4 text-destructive">{row.informal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* DIY vs Tadbeer */}
      <section className="py-14 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Can I Sponsor a Maid Without Tadbeer?</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              <strong>Expats</strong> can sponsor on their own file, but the cost will be at least <strong>double</strong> what it costs through a Tadbeer center. The required documentation is also a significant burden — bank statements, salary certificates, Ejari, marriage certificates, proof of a 2-bedroom house, and more.
            </p>
            <p>
              <strong>UAE nationals</strong> can sponsor directly through MOHRE without a Tadbeer center. However, they still need to handle all visa processing, medical tests, insurance, and Emirates ID on their own.
            </p>
            <h3 className="text-xl font-semibold text-foreground">Risks of DIY Sponsorship</h3>
            <ul className="space-y-2 list-none pl-0">
              {[
                "Potential fines for non-compliance with MOHRE regulations",
                "No worker replacement guarantee",
                "Complex paperwork for visa, insurance, and medical processing",
                "No mediation support in case of disputes",
                "Risk of hiring through unlicensed channels",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* TADMAIDS */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">TADMAIDS – Your Licensed Tadbeer Center</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              <strong>TADMAIDS</strong> is an officially licensed and accredited Tadbeer center operating under MOHRE. We offer:
            </p>
            <ul className="space-y-2 list-none pl-0">
              {[
                "2-year maid visa processing from AED 9,000",
                "Free chauffeur service for all government procedures",
                "WPS-compliant salary management",
                "Unlimited NOC issuance for travel",
                "ILOE insurance and full documentation support",
                "Monthly maid packages available",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Frequently Asked Questions About Tadbeer</h2>
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
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Visit Our Licensed Tadbeer Center</h2>
          <p className="text-lg opacity-90 mb-8">Open Sunday – Saturday, 10:00 AM – 8:00 PM. Full domestic worker services under MOHRE regulation.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" onClick={() => window.open(WHATSAPP_URL, "_blank")}>
              <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp Us
            </Button>
            <Link to="/tadbeer">
              <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                See Full Tadbeer Page <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default WhatIsTadbeer;
