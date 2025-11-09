import { useEffect } from "react";
import ALHHero from "@/components/alh/ALHHero";
import ALHTimeline from "@/components/alh/ALHTimeline";
import ALHPerks from "@/components/alh/ALHPerks";
import ALHBenefits from "@/components/alh/ALHBenefits";
import ALHPilot from "@/components/alh/ALHPilot";
import ALHCompliance from "@/components/alh/ALHCompliance";
import ALHForm from "@/components/alh/ALHForm";
import ALHFooter from "@/components/alh/ALHFooter";

const ALH = () => {
  useEffect(() => {
    // Track page view
    if ((window as any).gtag) {
      (window as any).gtag('event', 'view_hero', {
        page_path: '/ALH'
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">
      <ALHHero />
      <ALHTimeline />
      <ALHPerks />
      <ALHBenefits />
      <ALHPilot />
      <ALHCompliance />
      <ALHForm />
      <ALHFooter />
    </div>
  );
};

export default ALH;
