import LocationLandingPage, { LocationPageData } from "@/components/seo/LocationLandingPage";

const data: LocationPageData = {
  slug: "maid-agency-dubai",
  emirate: "Dubai",
  metaTitle: "Best Maid Agency in Dubai | TADMAIDS Tadbeer Center",
  metaDescription: "[PLACEHOLDER: Under 160 chars. E.g. 'Looking for a trusted maid agency in Dubai? TADMAIDS is a licensed Tadbeer center offering 2-year maid visas, monthly maids & more.']",
  h1: "Best Maid Agency in Dubai",
  heroSubtext: "[PLACEHOLDER: E.g. 'Licensed Tadbeer center providing professional domestic workers across all Dubai communities.']",
  introParagraph: "[PLACEHOLDER: 2-3 sentences about TADMAIDS services in Dubai. Mention keywords: maid agency Dubai, tadbeer center Dubai, domestic worker Dubai.]",
  services: [
    { title: "[Service 1 - e.g. 2-Year Maid Visa Dubai]", description: "[Description]" },
    { title: "[Service 2 - e.g. Monthly Maid Dubai]", description: "[Description]" },
    { title: "[Service 3 - e.g. Nanny Services Dubai]", description: "[Description]" },
    { title: "[Service 4 - e.g. Housemaid Recruitment Dubai]", description: "[Description]" },
  ],
  areasServed: [
    "[e.g. Dubai Marina]", "[e.g. JBR]", "[e.g. Downtown Dubai]",
    "[e.g. Arabian Ranches]", "[e.g. Palm Jumeirah]", "[e.g. JVC]",
    "[e.g. Business Bay]", "[e.g. Al Barsha]"
  ],
  faqs: [
    { question: "[e.g. How much does a maid cost in Dubai?]", answer: "[Answer - don't reveal exact costs, direct to contact]" },
    { question: "[e.g. Is TADMAIDS a licensed Tadbeer center in Dubai?]", answer: "[Answer]" },
    { question: "[e.g. How long does it take to get a maid in Dubai?]", answer: "[Answer]" },
    { question: "[e.g. What nationalities of maids are available in Dubai?]", answer: "[Answer]" },
  ],
  localDetails: "[PLACEHOLDER: Optional extra paragraph about your Dubai office location, hours, or any Dubai-specific info.]",
};

const MaidAgencyDubai = () => <LocationLandingPage data={data} />;
export default MaidAgencyDubai;
