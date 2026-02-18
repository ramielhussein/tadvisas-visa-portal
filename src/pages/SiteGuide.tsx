import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import sitemapImage from "@/assets/sitemap.png";

const SiteGuide = () => {
  const handleDownloadPDF = async () => {
    const element = document.getElementById("site-guide-content");
    if (!element) return;

    toast.success("Generating PDF...");
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/jpeg", 0.98);

    const pdf = new jsPDF({ orientation: "portrait", unit: "in", format: "letter" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 2; // 1 inch margin each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let y = 1; // top margin
    let remainingHeight = imgHeight;

    while (remainingHeight > 0) {
      pdf.addImage(imgData, "JPEG", 1, y - (imgHeight - remainingHeight), imgWidth, imgHeight);
      remainingHeight -= (pageHeight - 2);
      if (remainingHeight > 0) pdf.addPage();
    }

    pdf.save("tadmaids-site-guide.pdf");
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
                  <li><strong>Admin Dashboard (/admin) - Admin.tsx</strong>: Main admin dashboard and hub</li>
                  <li><strong>CRM Dashboard (/crm/dashboard) - Dashboard.tsx</strong>: Sales performance metrics and analytics</li>
                  <li><strong>Lead Management (/crm/leads) - LeadManagement.tsx</strong>: CRM system for managing leads</li>
                  <li><strong>Lead Detail (/crm/leads/:id) - LeadDetail.tsx</strong>: Individual lead details and activities</li>
                  <li><strong>CV Wizard Review (/admin/cvwizard-review) - CVWizardReview.tsx</strong>: Review and approve worker applications</li>
                  <li><strong>CV Wizard Settings (/admin/cvwizard-settings) - CVWizardSettings.tsx</strong>: Configure CV wizard parameters</li>
                  <li><strong>Wizard Album (/wizardalbum) - WizardAlbum.tsx</strong>: Photo management for worker profiles</li>
                  <li><strong>My CVs (/my-cvs) - MyCVs.tsx</strong>: View your submitted worker CVs</li>
                  <li><strong>User Management (/admin/user-management) - UserManagement.tsx</strong>: Create new admin users</li>
                  <li><strong>User List (/admin/user-list) - UserList.tsx</strong>: Manage users and permissions</li>
                  <li><strong>Refunds List (/refundslist) - RefundsList.tsx</strong>: View finalized refund calculations</li>
                  <li><strong>Refunds Approval (/refunds-approval) - RefundsApproval.tsx</strong>: Approve/reject refund requests</li>
                  <li><strong>Reset Admin (/admin/reset-admin) - ResetAdmin.tsx</strong>: Password reset for admin users</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-2">ERP & FINANCE (Login Required)</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Financial Dashboard (/financial) - FinancialDashboard.tsx</strong>: Overview of revenue, A/R, A/P, and financial metrics</li>
                  <li><strong>Deals Management (/deals) - DealsManagement.tsx</strong>: View and manage sales deals</li>
                  <li><strong>Deal Detail (/deals/:id) - DealDetail.tsx</strong>: Individual deal information and timeline</li>
                  <li><strong>Create Deal (/deals/create) - CreateDeal.tsx</strong>: Create new sales deal from lead</li>
                  <li><strong>Contracts Management (/contracts) - ContractManagement.tsx</strong>: View all client contracts</li>
                  <li><strong>Create Contract (/contracts/create) - CreateContract.tsx</strong>: Generate contract from deal</li>
                  <li><strong>Payments List (/payments) - PaymentsList.tsx</strong>: View all recorded client payments</li>
                  <li><strong>Client Statement (/client-statement) - ClientStatement.tsx</strong>: Transaction ledger for specific client</li>
                  <li><strong>Suppliers Management (/suppliers) - SuppliersManagement.tsx</strong>: Manage supplier records and A/P</li>
                  <li><strong>Purchase Orders (/purchase-orders) - PurchaseOrders.tsx</strong>: Create and manage supplier purchase orders</li>
                  <li><strong>Bank Accounts (/bank-accounts) - BankAccountsManagement.tsx</strong>: Manage company bank accounts</li>
                  <li><strong>Bank Transfers (/bank-transfers) - BankTransfers.tsx</strong>: Record inter-bank transfers</li>
                  <li><strong>Chart of Accounts (/expense-categories) - ExpenseCategoriesManagement.tsx</strong>: Define expense categories</li>
                  <li><strong>Expenses (/expenses) - ExpensesManagement.tsx</strong>: Record and track business expenses</li>
                  <li><strong>Equity Accounts (/equity-accounts) - EquityAccountsManagement.tsx</strong>: Owner's capital accounts</li>
                  <li><strong>Owner Equity (/owner-equity) - OwnerEquity.tsx</strong>: Track owner investments and withdrawals</li>
                  <li><strong>Audit Logs (/audit-logs) - AuditLogs.tsx</strong>: System activity audit trail</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-2">CRM & SETTINGS (Login Required)</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Lead Sources (/crm/lead-sources) - LeadSourcesManagement.tsx</strong>: Manage lead source options</li>
                  <li><strong>Inquiry Packages (/crm/inquiry-packages) - InquiryPackagesManagement.tsx</strong>: Packages for lead forms</li>
                  <li><strong>Sales Packages (/crm/sales-packages) - SalesPackagesManagement.tsx</strong>: Products for deals/contracts</li>
                  <li><strong>Product Dashboard (/product-dashboard) - ProductDashboard.tsx</strong>: Product team operations hub</li>
                  <li><strong>Daily Headcount (/daily-headcount) - DailyHeadcount.tsx</strong>: Worker count tracking</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-2">KEY DATA FLOWS</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Client Submission Flow</strong>: Home → Start Here → submissions table → Client Submissions (Admin) → Convert to Lead</li>
                  <li><strong>Lead to Sale Flow</strong>: Lead Entry → leads table → Create Deal → deals table → Create Contract → contracts table → Auto-generate Invoice</li>
                  <li><strong>Payment Recording Flow</strong>: Invoice created → Record Payment (from Financial Dashboard or Invoices) → payments table → Invoice auto-updated → Client Statement updated</li>
                  <li><strong>Worker Application Flow</strong>: CV Wizard (10 steps) → wizard_submissions table → CV Wizard Review (Admin) → Approved workers</li>
                  <li><strong>Refund Flow</strong>: Refund Calculator → refunds table → Refunds Approval (Finance) → Finalized refunds</li>
                  <li><strong>Worker Album Flow</strong>: CV Wizard (photos) → Wizard Album (Admin review) → Country Albums (Public display)</li>
                  <li><strong>Purchase Order Flow</strong>: Create PO → purchase_orders table → Supplier approval → Payment tracking</li>
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