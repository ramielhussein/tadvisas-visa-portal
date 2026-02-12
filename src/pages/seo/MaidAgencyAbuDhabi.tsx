import LocationLandingPage, { LocationPageData } from "@/components/seo/LocationLandingPage";

const data: LocationPageData = {
  slug: "maid-agency-abu-dhabi",
  emirate: "Abu Dhabi",
  metaTitle: "Best Maid Agency in Abu Dhabi | TADMAIDS Tadbeer Center",
  metaDescription: "[PLACEHOLDER: Under 160 chars about maid services in Abu Dhabi]",
  h1: "Best Maid Agency in Abu Dhabi",
  heroSubtext: "[PLACEHOLDER: Hero subtitle about services in Abu Dhabi]",
  introParagraph: "[PLACEHOLDER: 2-3 sentences. Keywords: maid agency Abu Dhabi, tadbeer Abu Dhabi, domestic worker Abu Dhabi.]",
  services: [
    { title: "[Service 1]", description: "[Description]" },
    { title: "[Service 2]", description: "[Description]" },
    { title: "[Service 3]", description: "[Description]" },
    { title: "[Service 4]", description: "[Description]" },
  ],
  areasServed: [
    "[e.g. Al Reem Island]", "[e.g. Khalifa City]", "[e.g. Saadiyat Island]",
    "[e.g. Yas Island]", "[e.g. Al Raha]", "[e.g. Corniche]",
  ],
  faqs: [
    { question: "[FAQ 1 with Abu Dhabi keyword]", answer: "[Answer]" },
    { question: "[FAQ 2 with Abu Dhabi keyword]", answer: "[Answer]" },
    { question: "[FAQ 3 with Abu Dhabi keyword]", answer: "[Answer]" },
  ],
  localDetails: "[PLACEHOLDER: Optional Abu Dhabi-specific details]",
};

const MaidAgencyAbuDhabi = () => <LocationLandingPage data={data} />;
export default MaidAgencyAbuDhabi;
