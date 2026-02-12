import { useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle,
  Shield,
  AlertTriangle,
  Building2,
  FileText,
  Users,
  Clock,
  Car,
  Headphones,
  ChevronRight,
} from "lucide-react";

const WHATSAPP_URL = "https://wa.me/97143551186";
const PHONE = "+97143551186";

const TadbeerPage = () => {
  useEffect(() => {
    document.title = "Licensed Tadbeer Center in Dubai – Official Domestic Worker Services | TADMAIDS";
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "TADMAIDS is a licensed Tadbeer center in Dubai offering maid visa processing, direct hire, monthly packages, contract renewal & more. Government-regulated domestic worker services.");

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "TADMAIDS Tadbeer Center",
      "description": "Licensed Tadbeer center in Dubai offering domestic worker services including maid visas, direct hire, and monthly packages.",
      "url": "https://tadmaids.com/tadbeer",
      "telephone": PHONE,
      "address": { "@type": "PostalAddress", "addressLocality": "Dubai", "addressRegion": "Dubai", "addressCountry": "AE" },
      "sameAs": ["https://tadmaids.com"]
    };
    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(f => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": { "@type": "Answer", "text": f.answer }
      }))
    };
    const addJsonLd = (obj: object, id: string) => {
      let el = document.getElementById(id);
      if (!el) { el = document.createElement("script"); el.id = id; el.setAttribute("type", "application/ld+json"); document.head.appendChild(el); }
      el.textContent = JSON.stringify(obj);
    };
    addJsonLd(jsonLd, "jsonld-tadbeer");
    addJsonLd(faqJsonLd, "jsonld-tadbeer-faq");
    return () => {
      document.getElementById("jsonld-tadbeer")?.remove();
      document.getElementById("jsonld-tadbeer-faq")?.remove();
    };
  }, []);

  return (
    <Layout>
      {/* ═══════════════════════════════════════════
          1️⃣ HERO SECTION
      ═══════════════════════════════════════════ */}
      <section className="bg-primary text-primary-foreground py-16 md:py-24">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 px-4 py-1.5 rounded-full mb-6">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Official Tadbeer-Licensed Center in UAE</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight">
            Licensed Tadbeer Center in Dubai – Official Domestic Worker Services
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Government-regulated domestic worker services including maid visas, direct hire, and monthly packages.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8"
              onClick={() => window.open(WHATSAPP_URL, "_blank")}>
              <MessageCircle className="mr-2 h-5 w-5" />
              WhatsApp Now
            </Button>
            <Button size="lg" variant="outline"
              className="text-lg px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => window.open(`tel:${PHONE}`)}>
              <Phone className="mr-2 h-5 w-5" />
              Book Appointment
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          2️⃣ WHAT IS TADBEER?
      ═══════════════════════════════════════════ */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">What Is Tadbeer?</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              Tadbeer is a <strong>government-regulated service center system</strong> established by the UAE Ministry of Human Resources and Emiratisation (MOHRE). It was introduced to modernize and organize the domestic worker industry across the UAE, replacing traditional typing centers with licensed, professional service centers.
            </p>
            <p>
              Every Tadbeer center is licensed and audited by the government. These centers are the <strong>only legal channel</strong> through which residents can recruit, sponsor, and manage domestic workers in the UAE. The system ensures compliance with UAE labor law and protects the rights of both employers and domestic workers.
            </p>
            <p>Tadbeer centers handle:</p>
            <ul className="space-y-2 list-none pl-0">
              {[
                "Processing and issuing domestic worker visas under the employer's sponsorship",
                "Managing employment contracts in accordance with MOHRE standards",
                "Facilitating direct hire and monthly maid package arrangements",
                "Handling contract renewals, cancellations, and worker replacements",
                "Coordinating insurance, medical testing, and Emirates ID processing",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p>
              Unlike informal agencies, Tadbeer centers operate under strict government oversight. This means clear contracts, defined refund policies, and full legal compliance — giving UAE residents peace of mind when hiring domestic workers.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          3️⃣ WHAT SERVICES DOES TADBEER OFFER?
      ═══════════════════════════════════════════ */}
      <section className="py-14 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            What Services Does a Tadbeer Center Offer?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <div key={i} className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
                <s.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm mb-3">{s.description}</p>
                {s.link && (
                  <Link to={s.link} className="text-primary text-sm font-medium inline-flex items-center hover:underline">
                    Learn more <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          4️⃣ TADBEER VS INFORMAL AGENCIES
      ═══════════════════════════════════════════ */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Licensed Tadbeer Center vs. Informal Agency
          </h2>
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

      {/* ═══════════════════════════════════════════
          5️⃣ TADBEER VS SPONSORING ON YOUR OWN
      ═══════════════════════════════════════════ */}
      <section className="py-14 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Tadbeer vs. Sponsoring a Domestic Worker on Your Own
          </h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              Many UAE residents wonder if they can bypass Tadbeer and sponsor a domestic worker directly. Here's what you need to know:
            </p>
            <h3 className="text-xl font-semibold text-foreground">Can UAE Nationals Sponsor Directly?</h3>
            <p>
              Yes — UAE nationals (Emiratis) can sponsor domestic workers directly through MOHRE without a Tadbeer center. However, they still need to handle all visa processing, medical tests, insurance, contract registration, and Emirates ID applications on their own. Many Emiratis still choose Tadbeer centers for convenience and compliance assurance.
            </p>
            <h3 className="text-xl font-semibold text-foreground">Can Expats Sponsor Directly?</h3>
            <p>
              Expats in the UAE <strong>can sponsor on their own file</strong>, but the cost will be at least double what it would cost sponsoring via a Tadbeer center. The required documentation is also a burden — bank statements, salary certificates, Ejari, marriage certificates, proof of a 2-bedroom house, and more.
            </p>
            <p>
              If you use a <strong>Tadbeer center</strong> for domestic worker sponsorship, it ensures proper worker protection, legal contracts, and regulatory compliance. And <strong>most importantly — you save money and time</strong>.
            </p>
            <h3 className="text-xl font-semibold text-foreground">Risks of DIY Sponsorship</h3>
            <ul className="space-y-2 list-none pl-0">
              {[
                "Potential fines for non-compliance with MOHRE labor regulations",
                "No worker replacement guarantee if the domestic worker leaves",
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
            <div className="flex flex-wrap gap-3 mt-6 not-prose">
              <Link to="/hire-a-maid">
                <Button variant="outline">
                  <Users className="mr-2 h-4 w-4" /> Direct Hire Services
                </Button>
              </Link>
              <Link to="/get-a-visa">
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" /> Maid Visa Processing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          6️⃣ OUR TADBEER CENTER IN DUBAI
      ═══════════════════════════════════════════ */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Our Tadbeer Center in Dubai – TADMAIDS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-5">
              <p className="text-muted-foreground leading-relaxed">
                TADMAIDS is a <strong>fully licensed Tadbeer center</strong> located in Dubai, serving families across the UAE since establishment. We combine government compliance with exceptional service to make your domestic worker journey smooth and worry-free.
              </p>
              <div className="space-y-4">
                {centerFeatures.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{f.title}</h4>
                      <p className="text-muted-foreground text-sm">{f.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-muted/50 rounded-xl p-6 border border-border">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Visit Our Center
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Location:</strong> Tadmaids Center, Dubai, UAE</p>
                <p><strong className="text-foreground">Phone:</strong> +971 4 355 1186</p>
                <p><strong className="text-foreground">WhatsApp:</strong> Available 7 days a week</p>
                <p><strong className="text-foreground">Hours:</strong> Sunday – Saturday, 10:00 AM – 8:00 PM</p>
              </div>
              <div className="flex flex-col gap-3 mt-6">
                <Button className="w-full" onClick={() => window.open(WHATSAPP_URL, "_blank")}>
                  <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp Us
                </Button>
                <Button variant="outline" className="w-full" onClick={() => window.open(`tel:${PHONE}`)}>
                  <Phone className="mr-2 h-4 w-4" /> Call Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          7️⃣ FAQ SECTION
      ═══════════════════════════════════════════ */}
      <section className="py-14 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Frequently Asked Questions About Tadbeer
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-card border border-border rounded-lg px-4"
              >
                <AccordionTrigger className="text-left font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          INTERNAL LINKS (SEO Cluster)
      ═══════════════════════════════════════════ */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-xl font-semibold text-center mb-6">
            Find a Tadbeer Center Near You
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {locationLinks.map((link, i) => (
              <Link
                key={i}
                to={link.path}
                className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/20 transition-colors inline-flex items-center gap-1.5"
              >
                <MapPin className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Get Started with Tadbeer?
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Whether you need a maid visa, direct hire, or a monthly domestic worker package — our licensed Tadbeer center is ready to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8"
              onClick={() => window.open(WHATSAPP_URL, "_blank")}>
              <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp Us Now
            </Button>
            <Button size="lg" variant="outline"
              className="text-lg px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => window.open(`tel:${PHONE}`)}>
              <Phone className="mr-2 h-5 w-5" /> Call +971 4 355 1186
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

// ═══════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════

const services = [
  {
    icon: FileText,
    title: "Maid Visa Processing",
    description: "Complete 2-year domestic worker visa processing including medical, Emirates ID, and MOHRE contract registration.",
    link: "/get-a-visa",
  },
  {
    icon: Users,
    title: "Direct Hire Services",
    description: "Hire a domestic worker of your choice with full Tadbeer compliance — contract, visa, and onboarding included.",
    link: "/hire-a-maid",
  },
  {
    icon: Clock,
    title: "Monthly Maid Packages",
    description: "Flexible monthly domestic worker packages starting from AED 2,100/month with zero admin fee options.",
    link: "/monthly-packages",
  },
  {
    icon: FileText,
    title: "Contract Renewal",
    description: "Seamless renewal of existing domestic worker contracts with updated MOHRE terms and visa extension.",
    link: null,
  },
  {
    icon: Users,
    title: "Cancellation & Replacement",
    description: "If your current domestic worker isn't the right fit, we handle the cancellation process and provide a replacement.",
    link: null,
  },
  {
    icon: Shield,
    title: "Insurance & Medical Processing",
    description: "Mandatory health insurance, medical fitness testing, and Emirates ID processing — all managed under one roof.",
    link: null,
  },
];

const comparisonRows = [
  { feature: "Government Regulated", tadbeer: "✓ Yes", informal: "✗ No oversight" },
  { feature: "Legal Contracts", tadbeer: "✓ MOHRE standard", informal: "✗ Risky agreements" },
  { feature: "Clear Refund Policy", tadbeer: "✓ Defined terms", informal: "✗ Often unclear" },
  { feature: "Visa Compliance", tadbeer: "✓ Full compliance", informal: "✗ Risk of fines" },
  { feature: "Worker Protection", tadbeer: "✓ Rights guaranteed", informal: "✗ No guarantees" },
  { feature: "Dispute Resolution", tadbeer: "✓ MOHRE mediation", informal: "✗ No support" },
];

const centerFeatures = [
  { icon: Building2, title: "Physical Office in Dubai", description: "Visit our center in person for consultations, document submission, and worker selection." },
  { icon: Clock, title: "Years of Experience", description: "Serving hundreds of families across the UAE with trusted domestic worker placements." },
  { icon: Car, title: "Chauffeur Service", description: "Unique to TADMAIDS — we deliver your domestic worker directly to your doorstep." },
  { icon: Shield, title: "ERP Tracking System", description: "Track your application status in real-time through our proprietary management system." },
  { icon: Headphones, title: "WhatsApp Support", description: "Reach us anytime via WhatsApp for quick responses and updates on your application." },
];

const faqs = [
  { question: "What is Tadbeer?", answer: "Tadbeer is a government-regulated domestic worker service center system in the UAE. Established by MOHRE (Ministry of Human Resources and Emiratisation), Tadbeer centers are the official and legal way to recruit, sponsor, and manage domestic workers including housemaids, nannies, cooks, and drivers." },
  { question: "Is Tadbeer mandatory in the UAE?", answer: "For expats, yes — using a licensed Tadbeer center is mandatory for sponsoring domestic workers. UAE nationals can sponsor directly but many still prefer Tadbeer centers for the convenience, compliance assurance, and worker replacement guarantees they provide." },
  { question: "Can expats use Tadbeer services?", answer: "Absolutely. In fact, expats are required to use a Tadbeer center for domestic worker sponsorship. The center handles all visa processing, contract registration, medical tests, and Emirates ID applications on your behalf." },
  { question: "How much does Tadbeer cost?", answer: "Tadbeer service costs vary depending on the type of service — maid visa processing, direct hire, or monthly packages. Contact our team via WhatsApp or phone for a personalized quote based on your requirements." },
  { question: "How long does the Tadbeer visa process take?", answer: "The typical domestic worker visa process through Tadbeer takes 2-4 weeks, depending on the worker's nationality, medical test results, and document verification. Our team works to expedite every application." },
  { question: "Is Tadbeer government-owned?", answer: "Tadbeer is a government-regulated framework, not a government-owned company. The system is overseen by MOHRE, and individual Tadbeer centers like TADMAIDS are privately operated but government-licensed and regularly audited." },
];

const locationLinks = [
  { label: "Tadbeer Near Me", path: "/tadbeer-near-me" },
  { label: "Tadbeer Dubai", path: "/tadbeer-dubai" },
  { label: "Tadbeer Abu Dhabi", path: "/tadbeer-abu-dhabi" },
  { label: "Tadbeer Sharjah", path: "/tadbeer-sharjah" },
  { label: "Tadbeer Majan", path: "/tadbeer-majan" },
  { label: "Tadbeer Al Nahda", path: "/tadbeer-al-nahda" },
  { label: "Tadbeer Al Tawwan", path: "/tadbeer-al-tawwan" },
];

export default TadbeerPage;
