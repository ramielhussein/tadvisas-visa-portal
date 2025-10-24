import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";
import html2pdf from "html2pdf.js";
import { toast } from "sonner";
import sitemapImage from "@/assets/sitemap.png";

const SiteGuide = () => {
  const handleDownloadPDF = () => {
    const element = document.getElementById("site-guide-content");
    
    const opt = {
      margin: 1,
      filename: 'tadmaids-site-guide.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
    toast.success("Downloading site guide PDF...");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">TADMaids Site Guide</h1>
        <Button onClick={handleDownloadPDF} className="gap-2">
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
      </div>

      <Card className="p-8" id="site-guide-content">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Site Structure Map</h2>
            <img src={sitemapImage} alt="Site Structure" className="w-full rounded-lg shadow-lg" />
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Detailed Page Structure</h2>

            <div className="space-y-4">
              <section>
                <h3 className="text-xl font-semibold mb-2">PUBLIC PAGES (No Login Required)</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Home (/) - Index.tsx</strong>: Main landing page with hero, value proposition, trust indicators, CTA sections</li>
                  <li><strong>Start Here (/starthere) - StartHere.tsx</strong>: Client submission form for service requests</li>
                  <li><strong>Hire a Maid (/hireamaid) - HireAMaid.tsx</strong>: Information about hiring domestic workers</li>
                  <li><strong>Get a Visa (/getavisa) - GetAVisa.tsx</strong>: Visa information and services</li>
                  <li><strong>Monthly Packages (/monthlypackages) - MonthlyPackages.tsx</strong>: Pricing and package information</li>
                  <li><strong>Book Worker (/bookworker) - BookWorker.tsx</strong>: Worker booking system</li>
                  <li><strong>Refund Calculator (/refund) - Refund.tsx</strong>: Calculate potential refunds</li>
                  <li><strong>FAQ (/faq) - FAQ.tsx</strong>: Frequently asked questions</li>
                  <li><strong>Contact (/contact) - Contact.tsx</strong>: Contact information and form</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-2">CV WIZARD FLOW (For Workers)</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>CV Wizard (/cvwizard) - CVWizard.tsx</strong>: Multi-step form for worker applications
                    <ul className="list-circle pl-6 mt-1">
                      <li>Step 1: Identity (Step1Identity.tsx)</li>
                      <li>Step 2: Job Preferences (Step2Jobs.tsx)</li>
                      <li>Step 3: Languages (Step3Languages.tsx)</li>
                      <li>Step 4: Education (Step4Education.tsx)</li>
                      <li>Step 5: Experience (Step5Experience.tsx)</li>
                      <li>Step 6: Skills (Step6Skills.tsx)</li>
                      <li>Step 7: Visa Status (Step7Visa.tsx)</li>
                      <li>Step 8: Files Upload (Step8Files.tsx)</li>
                      <li>Step 9: Financial Info (Step9Financials.tsx)</li>
                      <li>Step 10: Consent (Step10Consent.tsx)</li>
                    </ul>
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-2">COUNTRY ALBUM PAGES</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Hub (/hub) - Hub.tsx</strong>: Central hub for country-specific worker albums</li>
                  <li><strong>Myanmar IC (/my-ic) - MyIc.tsx</strong>: Myanmar workers (in-country)</li>
                  <li><strong>Myanmar OC (/my-oc) - MyOc.tsx</strong>: Myanmar workers (out-of-country)</li>
                  <li><strong>Philippines IC (/ph-ic) - PhIc.tsx</strong>: Philippines workers (in-country)</li>
                  <li><strong>Philippines OC (/ph-oc) - PhOc.tsx</strong>: Philippines workers (out-of-country)</li>
                  <li><strong>Ethiopia IC (/et-ic) - EtIc.tsx</strong>: Ethiopia workers (in-country)</li>
                  <li><strong>Ethiopia OC (/et-oc) - EtOc.tsx</strong>: Ethiopia workers (out-of-country)</li>
                  <li><strong>Indonesia IC (/id-ic) - IdIc.tsx</strong>: Indonesia workers (in-country)</li>
                  <li><strong>Indonesia OC (/id-oc) - IdOc.tsx</strong>: Indonesia workers (out-of-country)</li>
                  <li><strong>Africa IC (/af-ic) - AfIc.tsx</strong>: African workers (in-country)</li>
                  <li><strong>Africa OC (/af-oc) - AfOc.tsx</strong>: African workers (out-of-country)</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-2">ADMIN PAGES (Login Required)</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Login (/auth) - Auth.tsx</strong>: Admin authentication page</li>
                  <li><strong>Admin Dashboard (/admin) - Admin.tsx</strong>: Main admin dashboard</li>
                  <li><strong>Lead Management (/crm/leads) - LeadManagement.tsx</strong>: CRM system for managing leads</li>
                  <li><strong>CV Wizard Review (/admin/cvwizard-review) - CVWizardReview.tsx</strong>: Review and approve worker applications</li>
                  <li><strong>CV Wizard Settings (/admin/cvwizard-settings) - CVWizardSettings.tsx</strong>: Configure CV wizard parameters</li>
                  <li><strong>Wizard Album (/wizardalbum) - WizardAlbum.tsx</strong>: Photo management for worker profiles</li>
                  <li><strong>User Management (/admin/users) - UserManagement.tsx</strong>: Manage admin users and permissions</li>
                  <li><strong>User List (/admin/user-list) - UserList.tsx</strong>: List all users in system</li>
                  <li><strong>Refunds List (/refundslist) - RefundsList.tsx</strong>: View finalized refund calculations</li>
                  <li><strong>Reset Admin (/resetadmin) - ResetAdmin.tsx</strong>: Password reset for admin users</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-2">KEY DATA FLOWS</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Client Submission Flow</strong>: Home → Start Here → submissions table → Lead Management (CRM)</li>
                  <li><strong>Worker Application Flow</strong>: CV Wizard (10 steps) → wizard_submissions table → CV Wizard Review (Admin)</li>
                  <li><strong>Refund Flow</strong>: Refund Calculator → finalized_refunds table → Refunds List (Admin)</li>
                  <li><strong>Lead Management Flow</strong>: Quick Lead Entry → leads table → Lead Management → Round-robin assignment</li>
                  <li><strong>Worker Album Flow</strong>: CV Wizard (photos) → Wizard Album (Admin review) → Country Albums (Public display)</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-2">SHARED COMPONENTS</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Layout.tsx</strong>: Main layout wrapper with Navbar and Footer</li>
                  <li><strong>Navbar.tsx</strong>: Top navigation bar</li>
                  <li><strong>Footer.tsx</strong>: Site footer</li>
                  <li><strong>AdminMenu.tsx</strong>: Admin navigation menu</li>
                  <li><strong>ProtectedRoute.tsx</strong>: Route guard for admin pages</li>
                  <li><strong>FloatingButtons.tsx</strong>: Floating action buttons</li>
                  <li><strong>WhatsAppButton.tsx</strong>: WhatsApp contact button</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SiteGuide;