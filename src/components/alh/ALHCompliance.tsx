import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Shield } from "lucide-react";

const ALHCompliance = () => {
  return (
    <section id="compliance" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-[#0B409C] to-[#005792] rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#0B409C] mb-4">
            Data & Compliance
          </h2>
          <p className="text-xl text-[#4A4A4A]">
            PDPL-compliant data handling and privacy controls
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="consent" className="border border-[#B6BBC4] rounded-2xl px-6 bg-[#F5F7FA]">
            <AccordionTrigger className="text-lg font-semibold text-[#1E1E1E] hover:text-[#0B409C] hover:no-underline">
              Consent & Purpose
            </AccordionTrigger>
            <AccordionContent className="text-[#4A4A4A] pt-4">
              Two-way PDPL-compliant referrals with explicit opt-in. All data collected is purpose-limited and used only for the collaboration specified in the pilot program.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="attribution" className="border border-[#B6BBC4] rounded-2xl px-6 bg-[#F5F7FA]">
            <AccordionTrigger className="text-lg font-semibold text-[#1E1E1E] hover:text-[#0B409C] hover:no-underline">
              Attribution & Tracking
            </AccordionTrigger>
            <AccordionContent className="text-[#4A4A4A] pt-4">
              Hashed audience sharing ensures privacy protection. Unique QR codes and UTM parameters provide accurate attribution without exposing personal data.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="privacy" className="border border-[#B6BBC4] rounded-2xl px-6 bg-[#F5F7FA]">
            <AccordionTrigger className="text-lg font-semibold text-[#1E1E1E] hover:text-[#0B409C] hover:no-underline">
              Retention & Opt-out
            </AccordionTrigger>
            <AccordionContent className="text-[#4A4A4A] pt-4">
              Complete audit trail maintained. Users can opt out at any time. Data retention follows defined windows with automatic purging after the retention period expires.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
};

export default ALHCompliance;
