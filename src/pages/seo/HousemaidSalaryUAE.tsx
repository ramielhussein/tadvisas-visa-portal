import { useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Phone, MessageCircle, Shield, AlertTriangle, CheckCircle, DollarSign, ChevronRight } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/971567222248";
const PHONE = "+971567222248";

const faqs = [
  {
    question: "What is the salary of a housemaid in the UAE?",
    answer: "There is no fixed government salary guideline. Salaries are determined by mutual agreement. For certain nationalities like the Philippines, embassy minimums apply — approximately AED 1,500 (USD 400). Important: distinguish between the worker's net salary and the total monthly package payment to a service provider."
  },
  {
    question: "What is the minimum salary required for a maid visa?",
    answer: "There is no fixed UAE government minimum salary requirement for most domestic workers. However, certain nationalities have embassy-imposed minimums. Filipino workers generally require approximately AED 1,500 (USD 400). For other nationalities, salary is based on mutual agreement."
  },
  {
    question: "How much should I pay my maid monthly?",
    answer: "Salaries are based on supply and demand, experience, and nationality. As long as both parties agree and it complies with embassy requirements, there is flexibility. Be cautious of individuals claiming freelance domestic worker visas requesting unusually high salaries — always verify legal sponsor and work authorization."
  },
  {
    question: "Is 3,000 AED a good salary for a maid in Dubai?",
    answer: "If AED 3,000 refers to the total monthly package cost (including visa, insurance, recruitment), this is normal. If it refers to net salary only, it is above market average for most nationalities. Salary depends on experience, nationality, market demand, and scope of responsibilities."
  },
  {
    question: "How is a domestic worker salary paid in the UAE?",
    answer: "Through TADMAIDS, we set up a direct debit via directdebit.ae (a Central Bank-licensed provider). Every agreed day, you send us the salary and we pay the worker on the agreed pay day. The worker receives an ATM card and can withdraw funds free from RAKBANK ATMs."
  },
];

const HousemaidSalaryUAE = () => {
  useEffect(() => {
    document.title = "Housemaid Salary in UAE 2025 – Guidelines, Minimums & Payment | TADMAIDS";
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Housemaid salary guide for the UAE. No fixed government minimum for most nationalities. Filipino minimum ~AED 1,500. Understand salary vs monthly package costs.");

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
    el.id = "jsonld-salary";
    el.type = "application/ld+json";
    el.textContent = JSON.stringify(faqJsonLd);
    document.head.appendChild(el);
    return () => { document.getElementById("jsonld-salary")?.remove(); };
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
            Housemaid Salary in the UAE – What Should You Pay?
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Understand salary guidelines, embassy minimums, and the difference between net salary and monthly package costs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" onClick={() => window.open(WHATSAPP_URL, "_blank")}>
              <MessageCircle className="mr-2 h-5 w-5" /> Ask Us on WhatsApp
            </Button>
          </div>
        </div>
      </section>

      {/* Key Distinction */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Salary vs. Monthly Package – Know the Difference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold">Salary</h3>
              </div>
              <p className="text-muted-foreground">The <strong>net amount</strong> the worker receives monthly. This is their take-home pay agreed upon between employer and worker.</p>
              <p className="text-sm text-muted-foreground mt-3">Example: AED 1,500/month for a Ugandan worker</p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold">Monthly Package</h3>
              </div>
              <p className="text-muted-foreground">The <strong>total amount</strong> paid to a service provider. Covers salary + visa costs, insurance, recruitment, and administrative services.</p>
              <p className="text-sm text-muted-foreground mt-3">Example: AED 2,800/month total (salary + services)</p>
            </div>
          </div>
          <div className="bg-muted/50 rounded-xl p-6 border border-border">
            <p className="text-muted-foreground">
              <strong>Important:</strong> When someone says "I pay AED 2,800 for my maid," this is typically the total monthly package — not the worker's salary. The worker may receive AED 1,500 as net salary, while the remaining amount covers visa, insurance, and service fees.
            </p>
          </div>
        </div>
      </section>

      {/* Embassy Minimums */}
      <section className="py-14 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Embassy Salary Requirements by Nationality</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              There is <strong>no fixed UAE government minimum salary</strong> for most domestic workers. However, certain nationalities have embassy-imposed requirements:
            </p>
            <div className="overflow-x-auto not-prose">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-3 px-4 font-semibold">Nationality</th>
                    <th className="text-left py-3 px-4 font-semibold">Minimum Salary</th>
                    <th className="text-left py-3 px-4 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-medium">Philippines</td>
                    <td className="py-3 px-4 text-primary font-semibold">~AED 1,500 (USD 400)</td>
                    <td className="py-3 px-4 text-muted-foreground">Embassy-regulated minimum</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-medium">Other nationalities</td>
                    <td className="py-3 px-4">By mutual agreement</td>
                    <td className="py-3 px-4 text-muted-foreground">Based on market demand & experience</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              For most nationalities, salary is determined by mutual agreement between employer and worker, influenced by experience, scope of work, and current market conditions.
            </p>
          </div>
        </div>
      </section>

      {/* Warning */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Watch Out for Freelance Claims
            </h2>
            <p className="text-muted-foreground mb-4">
              Some individuals claim to hold a "freelance" domestic worker visa and request unusually high salaries (AED 3,500–4,000). In many cases, domestic workers are <strong>not legally permitted to freelance independently</strong>.
            </p>
            <p className="text-muted-foreground mb-4">Before hiring any worker outside a licensed system, verify:</p>
            <ul className="space-y-2">
              {[
                "Who their legal sponsor is",
                "Whether they are officially allowed to work",
                "That their visa status is compliant",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How Salary is Paid */}
      <section className="py-14 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">How Is Domestic Worker Salary Paid Through TADMAIDS?</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              We set up a direct debit through <strong>directdebit.ae</strong>, a Central Bank-licensed payment provider. Here's how it works:
            </p>
            <ul className="space-y-2 list-none pl-0">
              {[
                "Every agreed day of the month, you send us the salary amount",
                "We pay the worker on the agreed pay day — usually before end of month",
                "The worker receives an ATM card linked to her bank account",
                "Free withdrawals from any RAKBANK ATM machine",
                "Full WPS (Wage Protection System) compliance",
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
      <section className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Salary FAQs</h2>
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
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Need Help With Salary & Visa Setup?</h2>
          <p className="text-lg opacity-90 mb-8">Our team can advise on salary guidelines for your worker's nationality and set up WPS-compliant payments.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" onClick={() => window.open(WHATSAPP_URL, "_blank")}>
              <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp Us Now
            </Button>
            <Link to="/maid-visa-cost-dubai">
              <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                See Visa Costs <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HousemaidSalaryUAE;
