
import Layout from "@/components/Layout";
import TopBanner from "@/components/sections/TopBanner";
import Hero from "@/components/sections/Hero";
import ValueProposition from "@/components/sections/ValueProposition";
import HowItWorksPreview from "@/components/sections/HowItWorksPreview";
import TrustIndicators from "@/components/sections/TrustIndicators";
import CTA from "@/components/sections/CTA";

const Index = () => {
  return (
    <Layout>
      <TopBanner />
      <Hero />
      <ValueProposition />
      <HowItWorksPreview />
      <TrustIndicators />
      <CTA />
    </Layout>
  );
};

export default Index;
