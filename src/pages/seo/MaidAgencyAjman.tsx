import LocationLandingPage, { LocationPageData } from "@/components/seo/LocationLandingPage";

const data: LocationPageData = {
  slug: "maid-agency-ajman",
  emirate: "Ajman",
  metaTitle: "Best Maid Agency in Ajman | TADMAIDS Tadbeer Center",
  metaDescription: "[PLACEHOLDER: Under 160 chars about maid services in Ajman]",
  h1: "Best Maid Agency in Ajman",
  heroSubtext: "[PLACEHOLDER: Hero subtitle about services in Ajman]",
  introParagraph: "[PLACEHOLDER: 2-3 sentences. Keywords: maid agency Ajman, tadbeer Ajman, domestic worker Ajman.]",
  services: [
    { title: "[Service 1]", description: "[Description]" },
    { title: "[Service 2]", description: "[Description]" },
    { title: "[Service 3]", description: "[Description]" },
    { title: "[Service 4]", description: "[Description]" },
  ],
  areasServed: [
    "[e.g. Al Nuaimiya]", "[e.g. Al Rashidiya]", "[e.g. Al Jurf]",
    "[e.g. Emirates City]", "[e.g. Al Hamidiya]", "[e.g. Ajman Corniche]",
  ],
  faqs: [
    { question: "[FAQ 1 with Ajman keyword]", answer: "[Answer]" },
    { question: "[FAQ 2 with Ajman keyword]", answer: "[Answer]" },
    { question: "[FAQ 3 with Ajman keyword]", answer: "[Answer]" },
  ],
  localDetails: "[PLACEHOLDER: Optional Ajman-specific details]",
};

const MaidAgencyAjman = () => <LocationLandingPage data={data} />;
export default MaidAgencyAjman;
