import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
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
import { tadbeerLocations, TadbeerLocation } from "@/data/tadbeerLocations";

const WHATSAPP_URL = "https://wa.me/97143551186";
const PHONE = "+97143551186";

interface Props {
  location: TadbeerLocation;
}

const TadbeerLocationPageContent = ({ location: loc }: Props) => {
  const { area, emirate, landmarks, clientProfile, popularServices, parking, intro, whyTadbeer, slug } = loc;

  useEffect(() => {
    document.title = `Tadbeer Near ${area} – Licensed Domestic Worker Services | TADMAIDS`;
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", `Looking for a Tadbeer center near ${area}, ${emirate}? TADMAIDS offers licensed maid visa processing, direct hire & monthly packages. Government-regulated domestic worker services.`);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": `TADMAIDS – Tadbeer Services Near ${area}`,
      "description": `Licensed Tadbeer center serving ${area}, ${emirate}. Maid visa processing, direct hire, monthly packages, and domestic worker management.`,
      "url": `https://tadmaids.com/${slug}`,
      "telephone": PHONE,
      "address": { "@type": "PostalAddress", "addressLocality": emirate, "addressRegion": emirate, "addressCountry": "AE" },
      "areaServed": { "@type": "Place", "name": `${area}, ${emirate}` },
      "sameAs": ["https://tadmaids.com"]
    };
    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": getFaqs(area, emirate).map(f => ({
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
    addJsonLd(jsonLd, `jsonld-${slug}`);
    addJsonLd(faqJsonLd, `jsonld-${slug}-faq`);
    return () => {
      document.getElementById(`jsonld-${slug}`)?.remove();
      document.getElementById(`jsonld-${slug}-faq`)?.remove();
    };
  }, [area, emirate, slug]);

  const faqs = getFaqs(area, emirate);

  return (
    <Layout>
      {/* HERO */}
      <section className="bg-primary text-primary-foreground py-16 md:py-24">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 px-4 py-1.5 rounded-full mb-6">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">Serving {area}, {emirate}</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight">
            Tadbeer Near {area} – Licensed Domestic Worker Services
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Government-regulated maid visa processing, direct hire, and monthly packages for residents of {area} and surrounding areas in {emirate}.
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

      {/* AREA INTRO */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Tadbeer Services for {area} Residents
          </h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>{intro}</p>
            <p>{clientProfile}</p>
            <h3 className="text-xl font-semibold text-foreground">Nearby Landmarks</h3>
            <p>
              Our Tadbeer services are conveniently accessible for residents near {landmarks.join(", ")}. Whether you live in a villa community or apartment tower in {area}, we serve your location with professional domestic worker solutions.
            </p>
          </div>
        </div>
      </section>

      {/* POPULAR SERVICES IN THIS AREA */}
      <section className="py-14 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Popular Tadbeer Services in {area}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {popularServices.map((service, i) => (
              <div key={i} className="flex items-start gap-3 bg-card rounded-lg p-5 border border-border">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span className="font-medium">{service}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: FileText, title: "Maid Visa Processing", desc: "Complete 2-year domestic worker visa with medical, Emirates ID & MOHRE contract.", link: "/get-a-visa" },
              { icon: Users, title: "Direct Hire", desc: "Bring your own worker with full Tadbeer compliance and documentation.", link: "/hire-a-maid" },
              { icon: Clock, title: "Monthly Packages", desc: "Flexible domestic worker packages starting from AED 2,100/month.", link: "/monthly-packages" },
            ].map((s, i) => (
              <div key={i} className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
                <s.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm mb-3">{s.desc}</p>
                <Link to={s.link} className="text-primary text-sm font-medium inline-flex items-center hover:underline">
                  Learn more <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY TADBEER FOR THIS AREA */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Why Use a Licensed Tadbeer Center Near {area}?
          </h2>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>{whyTadbeer}</p>
            <p>
              Many residents in {area} make the mistake of hiring domestic workers through informal channels — Facebook groups, word-of-mouth, or unlicensed agents. While this may seem easier, it exposes you to significant legal and financial risks under UAE labor law.
            </p>
            <h3 className="text-xl font-semibold text-foreground">Risks of Hiring Without Tadbeer</h3>
            <ul className="space-y-2 list-none pl-0">
              {[
                "Fines of up to AED 100,000 for employing an undocumented worker",
                "No legal contract means no protection if disputes arise",
                "No insurance coverage for the worker or employer",
                "No replacement guarantee if the worker leaves or underperforms",
                "Potential criminal liability for visa violations",
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

      {/* TADBEER VS INFORMAL */}
      <section className="py-14 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Licensed Tadbeer vs. Informal Hiring in {area}
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
                      <AlertTriangle className="h-4 w-4" /> Informal Hiring
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Government Regulated", tadbeer: "✓ Yes", informal: "✗ No oversight" },
                  { feature: "Legal Contracts", tadbeer: "✓ MOHRE standard", informal: "✗ Risky agreements" },
                  { feature: "Clear Refund Policy", tadbeer: "✓ Defined terms", informal: "✗ Often unclear" },
                  { feature: "Visa Compliance", tadbeer: "✓ Full compliance", informal: "✗ Risk of fines" },
                  { feature: "Worker Protection", tadbeer: "✓ Rights guaranteed", informal: "✗ No guarantees" },
                  { feature: "Worker Replacement", tadbeer: "✓ Guaranteed", informal: "✗ No support" },
                ].map((row, i) => (
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

      {/* OUR CENTER */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            TADMAIDS – Serving {area} from Our Dubai Center
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-5">
              <p className="text-muted-foreground leading-relaxed">
                TADMAIDS is a <strong>fully licensed Tadbeer center</strong> serving families in {area} and across {emirate}. We combine government compliance with exceptional service, including our signature chauffeur delivery — bringing your domestic worker directly to your doorstep in {area}.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Building2, title: "Physical Office in Dubai", description: "Visit our center for consultations, document submission, and worker selection." },
                  { icon: Car, title: `Chauffeur Delivery to ${area}`, description: `We deliver your domestic worker directly to your home in ${area} — a service unique to TADMAIDS.` },
                  { icon: Shield, title: "ERP Tracking System", description: "Track your visa application and worker status in real-time through our system." },
                  { icon: Headphones, title: "WhatsApp Support", description: "Reach us anytime via WhatsApp for quick responses and updates." },
                ].map((f, i) => (
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
                <p><strong className="text-foreground">Parking:</strong> {parking}</p>
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

      {/* FAQ */}
      <section className="py-14 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Tadbeer FAQ – {area}, {emirate}
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

      {/* HIDDEN INTERNAL LINKS */}
      <section className="sr-only" aria-hidden="true">
        <div>
          <Link to="/tadbeer">Tadbeer Main Page</Link>
          <Link to="/get-a-visa">Maid Visa Processing</Link>
          <Link to="/hire-a-maid">Direct Hire</Link>
          <Link to="/monthly-packages">Monthly Packages</Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Need a Domestic Worker in {area}?
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Whether you need a maid visa, direct hire, or a monthly package — our licensed Tadbeer center serves {area} with professional, government-compliant domestic worker services.
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

function getFaqs(area: string, emirate: string) {
  return [
    {
      question: `Is there a Tadbeer center near ${area}?`,
      answer: `Yes — TADMAIDS is a licensed Tadbeer center serving residents of ${area} and surrounding areas in ${emirate}. While our physical center is in Dubai, we provide chauffeur delivery of domestic workers directly to your home in ${area}.`,
    },
    {
      question: `How much does a maid cost through Tadbeer in ${area}?`,
      answer: `Tadbeer service costs depend on the type of service — maid visa processing, direct hire, or monthly packages. Pricing is standardized by MOHRE but varies by worker nationality and service type. Contact our team via WhatsApp for a personalized quote for ${area} residents.`,
    },
    {
      question: `Can I hire a maid in ${area} without Tadbeer?`,
      answer: `For expats in ${area}, using a licensed Tadbeer center is the most cost-effective and legally compliant way to hire a domestic worker. Sponsoring on your own file is possible but costs at least double and requires extensive documentation. UAE nationals can sponsor directly but many choose Tadbeer for convenience.`,
    },
    {
      question: `How long does the Tadbeer visa process take for ${area} residents?`,
      answer: `The typical domestic worker visa process takes 2-4 weeks, depending on the worker's nationality and document verification. We serve ${area} residents with the same timeline and deliver workers directly to your home upon visa completion.`,
    },
    {
      question: `Do you deliver domestic workers to ${area}?`,
      answer: `Yes — TADMAIDS offers a unique chauffeur delivery service. Once your domestic worker's visa and documentation are complete, we deliver them directly to your home in ${area}, ${emirate}. This is a service unique to TADMAIDS.`,
    },
    {
      question: `What if my maid doesn't work out in ${area}?`,
      answer: `As a licensed Tadbeer center, we offer worker replacement guarantees as part of our service. If your domestic worker isn't the right fit, we handle the replacement process including cancellation, new selection, and delivery — all covered under your original agreement.`,
    },
  ];
}

export default TadbeerLocationPageContent;
