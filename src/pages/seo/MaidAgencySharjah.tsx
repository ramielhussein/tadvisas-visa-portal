import LocationLandingPage, { LocationPageData } from "@/components/seo/LocationLandingPage";

const data: LocationPageData = {
  slug: "maid-agency-sharjah",
  emirate: "Sharjah",
  metaTitle: "Best Maid Agency in Sharjah | TADMAIDS Tadbeer Center",
  metaDescription: "[PLACEHOLDER: Under 160 chars about maid services in Sharjah]",
  h1: "Best Maid Agency in Sharjah",
  heroSubtext: "[PLACEHOLDER: Hero subtitle about services in Sharjah]",
  introParagraph: "[PLACEHOLDER: 2-3 sentences. Keywords: maid agency Sharjah, tadbeer Sharjah, domestic worker Sharjah.]",
  services: [
    { title: "[Service 1]", description: "[Description]" },
    { title: "[Service 2]", description: "[Description]" },
    { title: "[Service 3]", description: "[Description]" },
    { title: "[Service 4]", description: "[Description]" },
  ],
  areasServed: [
    "[e.g. Al Nahda]", "[e.g. Al Majaz]", "[e.g. Al Khan]",
    "[e.g. Muwaileh]", "[e.g. University City]", "[e.g. Al Qasimia]",
  ],
  faqs: [
    { question: "[FAQ 1 with Sharjah keyword]", answer: "[Answer]" },
    { question: "[FAQ 2 with Sharjah keyword]", answer: "[Answer]" },
    { question: "[FAQ 3 with Sharjah keyword]", answer: "[Answer]" },
  ],
  localDetails: "[PLACEHOLDER: Optional Sharjah-specific details]",
};

const MaidAgencySharjah = () => <LocationLandingPage data={data} />;
export default MaidAgencySharjah;
