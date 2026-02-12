import { useEffect } from "react";
import Layout from "@/components/Layout";
import { Phone, MessageCircle, MapPin, CheckCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface LocationPageData {
  slug: string;
  emirate: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  heroSubtext: string;
  introParagraph: string;
  services: { title: string; description: string }[];
  areasServed: string[];
  faqs: { question: string; answer: string }[];
  localDetails?: string;
  whatsappNumber?: string;
  phoneNumber?: string;
}

const PLACEHOLDER: LocationPageData = {
  slug: "",
  emirate: "",
  metaTitle: "Maid Agency in [City] | TADMAIDS",
  metaDescription: "Looking for a trusted maid agency in [City]? TADMAIDS offers...",
  h1: "Best Maid Agency in [City]",
  heroSubtext: "[PLACEHOLDER: 1-2 sentence hero subtitle about your services in this emirate]",
  introParagraph: "[PLACEHOLDER: 2-3 sentences about TADMAIDS services in this emirate. Include keywords like 'maid agency', 'tadbeer center', and the city name.]",
  services: [
    { title: "[Service 1]", description: "[Description of service 1 in this location]" },
    { title: "[Service 2]", description: "[Description of service 2 in this location]" },
    { title: "[Service 3]", description: "[Description of service 3 in this location]" },
    { title: "[Service 4]", description: "[Description of service 4 in this location]" },
  ],
  areasServed: ["[Area 1]", "[Area 2]", "[Area 3]", "[Area 4]", "[Area 5]", "[Area 6]"],
  faqs: [
    { question: "[FAQ 1 with location keyword?]", answer: "[Answer 1]" },
    { question: "[FAQ 2 with location keyword?]", answer: "[Answer 2]" },
    { question: "[FAQ 3 with location keyword?]", answer: "[Answer 3]" },
  ],
  whatsappNumber: "97143551186",
  phoneNumber: "+97143551186",
};

interface LocationLandingPageProps {
  data: LocationPageData;
}

const LocationLandingPage = ({ data }: LocationLandingPageProps) => {
  const d = { ...PLACEHOLDER, ...data };
  const whatsappUrl = `https://wa.me/${d.whatsappNumber || "97143551186"}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `TADMAIDS - ${d.emirate}`,
    "description": d.metaDescription,
    "url": `https://tadmaids.com/${d.slug}`,
    "telephone": d.phoneNumber || "+97143551186",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": d.emirate,
      "addressCountry": "AE"
    },
    "areaServed": d.areasServed.map(area => ({
      "@type": "Place",
      "name": area
    })),
    "sameAs": ["https://tadmaids.com"]
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": d.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  useEffect(() => {
    document.title = d.metaTitle;
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", d.metaDescription);

    // JSON-LD
    const addJsonLd = (obj: object, id: string) => {
      let el = document.getElementById(id);
      if (!el) { el = document.createElement("script"); el.id = id; el.setAttribute("type", "application/ld+json"); document.head.appendChild(el); }
      el.textContent = JSON.stringify(obj);
    };
    addJsonLd(jsonLd, "jsonld-local");
    addJsonLd(faqJsonLd, "jsonld-faq");

    return () => {
      document.getElementById("jsonld-local")?.remove();
      document.getElementById("jsonld-faq")?.remove();
    };
  }, [d.metaTitle, d.metaDescription]);

  return (
    <Layout>

      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-16 md:py-24">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wider opacity-80">
              {d.emirate}, UAE
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            {d.h1}
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            {d.heroSubtext}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8"
              onClick={() => window.open(whatsappUrl, "_blank")}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              WhatsApp Us
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => window.open(`tel:${d.phoneNumber || "+97143551186"}`)}
            >
              <Phone className="mr-2 h-5 w-5" />
              Call Now
            </Button>
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <p className="text-lg text-muted-foreground leading-relaxed text-center">
            {d.introParagraph}
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Our Services in {d.emirate}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {d.services.map((service, i) => (
              <div
                key={i}
                className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{service.title}</h3>
                    <p className="text-muted-foreground text-sm">{service.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Areas Served */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Areas We Serve in {d.emirate}
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {d.areasServed.map((area, i) => (
              <span
                key={i}
                className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium"
              >
                <MapPin className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Frequently Asked Questions – {d.emirate}
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {d.faqs.map((faq, i) => (
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

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Find Your Perfect Maid in {d.emirate}?
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Contact TADMAIDS today. Licensed Tadbeer center serving all of {d.emirate}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8"
              onClick={() => window.open(whatsappUrl, "_blank")}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              WhatsApp Us Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => window.open(`tel:${d.phoneNumber || "+97143551186"}`)}
            >
              <Phone className="mr-2 h-5 w-5" />
              Call +971 4 355 1186
            </Button>
          </div>
        </div>
      </section>

      {/* Local Details */}
      {d.localDetails && (
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4 max-w-3xl">
            <p className="text-muted-foreground text-center leading-relaxed">
              {d.localDetails}
            </p>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default LocationLandingPage;
