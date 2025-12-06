
import SendPersonalReports from "./pages/admin/SendPersonalReports";
import ImportContracts from "./pages/admin/ImportContracts";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { useAutoAttendance } from "./hooks/useAutoAttendance";
import Index from "./pages/Index";
import HireAMaid from "./pages/HireAMaid";
import GetAVisa from "./pages/GetAVisa";
import MonthlyPackages from "./pages/MonthlyPackages";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import StartHere from "./pages/StartHere";
import Admin from "./pages/Admin";
import ClientSubmissions from "./pages/ClientSubmissions";
import Refund from "./pages/Refund";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/ProtectedRoute";
import IdOc from "./pages/IdOc";
import IdIc from "./pages/IdIc";
import PhIc from "./pages/PhIc";
import PhOc from "./pages/PhOc";
import CVWizard from "./pages/CVWizard";
import CVWizardSettings from "./pages/admin/CVWizardSettings";
import CVWizardReview from "./pages/admin/CVWizardReview";
import UserManagement from "./pages/admin/UserManagement";
import UserList from "./pages/admin/UserList";
import ResetAdmin from "./pages/ResetAdmin";
import EtIc from "./pages/EtIc";
import EtOc from "./pages/EtOc";
import AfIc from "./pages/AfIc";
import AfOc from "./pages/AfOc";
import MyIc from "./pages/MyIc";
import MyOc from "./pages/MyOc";
import Hub from "./pages/Hub";
import BookWorker from "./pages/BookWorker";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import LeadManagement from "./pages/LeadManagement";
import LeadDetail from "./pages/LeadDetail";
import Dashboard from "./pages/Dashboard";
import DealsManagement from "./pages/DealsManagement";
import DealDetail from "./pages/DealDetail";
import CreateDeal from "./pages/CreateDeal";
import FinancialDashboard from "./pages/FinancialDashboard";
import SuppliersManagement from "./pages/SuppliersManagement";
import WizardAlbum from "./pages/WizardAlbum";
import RefundsList from "./pages/RefundsList";
import SiteGuide from "./pages/SiteGuide";
import ContractManagement from "./pages/ContractManagement";
import CreateContract from "./pages/CreateContract";
import RefundsApproval from "./pages/RefundsApproval";
import ProductHub from "./pages/hubs/ProductHub";
import SalesHub from "./pages/hubs/SalesHub";
import SalesTargets from "./pages/SalesTargets";
import FinanceHub from "./pages/hubs/FinanceHub";
import ClientPortal from "./pages/hubs/ClientPortal";
import CRMHub from "./pages/crm/CRMHub";
import PurchaseOrders from "./pages/PurchaseOrders";
import DailyHeadcount from "./pages/DailyHeadcount";
import MyCVs from "./pages/MyCVs";
import CVProspects from "./pages/CVProspects";
import PublicCVApplication from "./pages/PublicCVApplication";
import ExpenseCategoriesManagement from "./pages/ExpenseCategoriesManagement";
import ExpensesManagement from "./pages/ExpensesManagement";
import BankTransfers from "./pages/BankTransfers";
import BankAccountsManagement from "./pages/BankAccountsManagement";
import EquityAccountsManagement from "./pages/EquityAccountsManagement";
import OwnerEquity from "./pages/OwnerEquity";
import AuditLogs from "./pages/AuditLogs";
import InstallApp from "./pages/InstallApp";
import LeadSourcesManagement from "./pages/LeadSourcesManagement";
import InquiryPackagesManagement from "./pages/InquiryPackagesManagement";
import SalesPackagesManagement from "./pages/SalesPackagesManagement";
import PaymentsList from "./pages/PaymentsList";
import ClientStatement from "./pages/ClientStatement";
import NationalityWorkflows from "./pages/NationalityWorkflows";
import WorkerReturns from "./pages/WorkerReturns";
import WorkerTransfers from "./pages/WorkerTransfers";
import ReceiptOrders from "./pages/ReceiptOrders";
import DeliveryOrders from "./pages/DeliveryOrders";
import DailySalesReport from "./pages/DailySalesReport";
import SalesReportsCenter from "./pages/SalesReportsCenter";
import LeadAttendanceReport from "./pages/LeadAttendanceReport";
import ALH from "./pages/ALH";
import FCG from "./pages/FCG";
import SalesPersonDashboard from "./pages/SalesPersonDashboard";
import SalesManagerDashboard from "./pages/SalesManagerDashboard";
import NationalityDashboard from "./pages/NationalityDashboard";
import DataBackup from "./pages/DataBackup";
import ContractRevenue from "./pages/ContractRevenue";
import HRDashboard from "./pages/HRDashboard";
import HRAttendance from "./pages/HRAttendance";
import HRPayroll from "./pages/HRPayroll";

// TadGo Driver App
import TadGoLanding from "./pages/tadgo/TadGoLanding";
import TadGoLogin from "./pages/tadgo/TadGoLogin";
import TadGoApp from "./pages/tadgo/TadGoApp";
import TadGoTaskDetail from "./pages/tadgo/TadGoTaskDetail";
import TadGoDriverDashboard from "./pages/tadgo/TadGoDriverDashboard";

// Gym Timer
import GymTimer from "./pages/GymTimer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppContent = () => {
  useAutoAttendance();
  return null;
};

// Redirect component for legacy deal URLs
const DealRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/crm/deals/${id}`} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppContent />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/hire-a-maid" element={<HireAMaid />} />
          <Route path="/get-a-visa" element={<GetAVisa />} />
          <Route path="/monthly-packages" element={<MonthlyPackages />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/start-here" element={<StartHere />} />
          <Route path="/ALH" element={<ALH />} />
          <Route path="/fcg" element={<FCG />} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/client-submissions" element={<ClientSubmissions />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/id-oc" element={<IdOc />} />
          <Route path="/id-ic" element={<IdIc />} />
          <Route path="/ph-ic" element={<PhIc />} />
          <Route path="/ph-oc" element={<PhOc />} />
          <Route path="/et-ic" element={<EtIc />} />
          <Route path="/et-oc" element={<EtOc />} />
          <Route path="/af-ic" element={<AfIc />} />
          <Route path="/af-oc" element={<AfOc />} />
          <Route path="/my-ic" element={<MyIc />} />
          <Route path="/my-oc" element={<MyOc />} />
          <Route path="/hub" element={<Hub />} />
          <Route path="/book-worker" element={<BookWorker />} />
          <Route path="/cvwizard" element={<ProtectedRoute><CVWizard /></ProtectedRoute>} />
          <Route path="/admin/cvwizard-settings" element={<ProtectedRoute><CVWizardSettings /></ProtectedRoute>} />
          <Route path="/admin/cvwizard-review" element={<ProtectedRoute><CVWizardReview /></ProtectedRoute>} />
          <Route path="/admin/user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/user-list" element={<ProtectedRoute><UserList /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><UserList /></ProtectedRoute>} />
          <Route path="/admin/send-personal-reports" element={<ProtectedRoute><SendPersonalReports /></ProtectedRoute>} />
          <Route path="/admin/client-submissions" element={<ProtectedRoute><ClientSubmissions /></ProtectedRoute>} />
          <Route path="/admin/cv-wizard-settings" element={<ProtectedRoute><CVWizardSettings /></ProtectedRoute>} />
          <Route path="/admin/reset-admin" element={<ResetAdmin />} />
          <Route path="/my-cvs" element={<ProtectedRoute><MyCVs /></ProtectedRoute>} />
          <Route path="/cv-prospects" element={<ProtectedRoute><CVProspects /></ProtectedRoute>} />
          <Route path="/apply" element={<PublicCVApplication />} />
          <Route path="/install" element={<InstallApp />} />
          <Route path="/wizardalbum" element={<WizardAlbum />} />
          <Route path="/siteguide" element={<ProtectedRoute><SiteGuide /></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
          
          {/* Legacy redirects for backward compatibility */}
          <Route path="/deals" element={<Navigate to="/crm/deals" replace />} />
          <Route path="/deals/create" element={<Navigate to="/crm/deals/create" replace />} />
          <Route path="/deals/:id" element={<DealRedirect />} />
          <Route path="/contracts" element={<Navigate to="/crm/contracts" replace />} />
          <Route path="/contracts/create" element={<Navigate to="/crm/contracts/create" replace />} />
          <Route path="/daily-sales-report" element={<Navigate to="/crm/daily-sales-report" replace />} />
          
          {/* CRM Module - Sales & Customer Management */}
          <Route path="/crm" element={<ProtectedRoute><CRMHub /></ProtectedRoute>} />
          <Route path="/crm/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/crm/leads" element={<ProtectedRoute><LeadManagement /></ProtectedRoute>} />
          <Route path="/crm/leads/:id" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
          <Route path="/crm/deals" element={<ProtectedRoute><DealsManagement /></ProtectedRoute>} />
          <Route path="/crm/deals/:id" element={<ProtectedRoute><DealDetail /></ProtectedRoute>} />
          <Route path="/crm/deals/create" element={<ProtectedRoute><CreateDeal /></ProtectedRoute>} />
          <Route path="/crm/contracts" element={<ProtectedRoute><ContractManagement /></ProtectedRoute>} />
          <Route path="/crm/contracts/create" element={<ProtectedRoute><CreateContract /></ProtectedRoute>} />
          <Route path="/crm/sales-targets" element={<ProtectedRoute><SalesTargets /></ProtectedRoute>} />
          <Route path="/crm/lead-sources" element={<ProtectedRoute><LeadSourcesManagement /></ProtectedRoute>} />
          <Route path="/crm/inquiry-packages" element={<ProtectedRoute><InquiryPackagesManagement /></ProtectedRoute>} />
          <Route path="/crm/sales-packages" element={<ProtectedRoute><SalesPackagesManagement /></ProtectedRoute>} />
          <Route path="/crm/daily-sales-report" element={<ProtectedRoute><DailySalesReport /></ProtectedRoute>} />
          <Route path="/crm/lead-attendance-report" element={<ProtectedRoute><LeadAttendanceReport /></ProtectedRoute>} />
          <Route path="/crm/sales-reports" element={<ProtectedRoute><SalesReportsCenter /></ProtectedRoute>} />
          <Route path="/crm/my-dashboard" element={<ProtectedRoute><SalesPersonDashboard /></ProtectedRoute>} />
          <Route path="/crm/team-dashboard" element={<ProtectedRoute><SalesManagerDashboard /></ProtectedRoute>} />
          
          {/* HR & Analytics */}
          <Route path="/hr/dashboard" element={<ProtectedRoute><HRDashboard /></ProtectedRoute>} />
          <Route path="/hr/attendance" element={<ProtectedRoute><HRAttendance /></ProtectedRoute>} />
          <Route path="/hr/payroll" element={<ProtectedRoute><HRPayroll /></ProtectedRoute>} />
          <Route path="/hr/nationality-dashboard" element={<ProtectedRoute><NationalityDashboard /></ProtectedRoute>} />
          
          {/* Finance Module - Financial Management */}
          <Route path="/finance" element={<ProtectedRoute><FinancialDashboard /></ProtectedRoute>} />
          <Route path="/finance/dashboard" element={<ProtectedRoute><FinancialDashboard /></ProtectedRoute>} />
          <Route path="/finance/payments" element={<ProtectedRoute><PaymentsList /></ProtectedRoute>} />
          <Route path="/finance/client-statement" element={<ProtectedRoute><ClientStatement /></ProtectedRoute>} />
          <Route path="/finance/bank-accounts" element={<ProtectedRoute><BankAccountsManagement /></ProtectedRoute>} />
          <Route path="/finance/bank-transfers" element={<ProtectedRoute><BankTransfers /></ProtectedRoute>} />
          <Route path="/finance/equity-accounts" element={<ProtectedRoute><EquityAccountsManagement /></ProtectedRoute>} />
          <Route path="/finance/owner-equity" element={<ProtectedRoute><OwnerEquity /></ProtectedRoute>} />
          <Route path="/finance/expenses" element={<ProtectedRoute><ExpensesManagement /></ProtectedRoute>} />
          <Route path="/finance/expense-categories" element={<ProtectedRoute><ExpenseCategoriesManagement /></ProtectedRoute>} />
          <Route path="/finance/refunds-approval" element={<ProtectedRoute><RefundsApproval /></ProtectedRoute>} />
          <Route path="/finance/refunds-list" element={<ProtectedRoute><RefundsList /></ProtectedRoute>} />
          <Route path="/finance/contract-revenue" element={<ProtectedRoute><ContractRevenue /></ProtectedRoute>} />
          
          {/* Product Module - Operations & Workers */}
          <Route path="/product/suppliers" element={<ProtectedRoute><SuppliersManagement /></ProtectedRoute>} />
          
          {/* Hub Routes - Role-Based Entry Points */}
          <Route path="/hub/sales" element={<ProtectedRoute><SalesHub /></ProtectedRoute>} />
          <Route path="/hub/finance" element={<ProtectedRoute><FinanceHub /></ProtectedRoute>} />
          <Route path="/hub/client" element={<ProtectedRoute><ClientPortal /></ProtectedRoute>} />
          <Route path="/product-dashboard" element={<ProtectedRoute><ProductHub /></ProtectedRoute>} />
          
          {/* Product Management Routes */}
          <Route path="/product/dashboard" element={<ProtectedRoute><ProductHub /></ProtectedRoute>} />
          <Route path="/product/purchase-orders" element={<ProtectedRoute><PurchaseOrders /></ProtectedRoute>} />
          <Route path="/product/receipt-orders" element={<ProtectedRoute><ReceiptOrders /></ProtectedRoute>} />
          <Route path="/product/delivery-orders" element={<ProtectedRoute><DeliveryOrders /></ProtectedRoute>} />
          <Route path="/product/daily-headcount" element={<ProtectedRoute><DailyHeadcount /></ProtectedRoute>} />
          <Route path="/product/nationality-workflows" element={<ProtectedRoute><NationalityWorkflows /></ProtectedRoute>} />
          <Route path="/product/worker-returns" element={<ProtectedRoute><WorkerReturns /></ProtectedRoute>} />
          <Route path="/product/worker-transfers" element={<ProtectedRoute><WorkerTransfers /></ProtectedRoute>} />
          
          {/* Dashboards */}
          <Route path="/nationality-dashboard" element={<NationalityDashboard />} />
          <Route path="/sales-manager-dashboard" element={<SalesManagerDashboard />} />
          <Route path="/sales-person-dashboard" element={<SalesPersonDashboard />} />
          <Route path="/admin/data-backup" element={<ProtectedRoute><DataBackup /></ProtectedRoute>} />
          <Route path="/admin/import-contracts" element={<ProtectedRoute><ImportContracts /></ProtectedRoute>} />
          
          {/* TadGo Driver App */}
          <Route path="/tadgo" element={<TadGoLanding />} />
          <Route path="/tadgo/login" element={<TadGoLogin />} />
          <Route path="/tadgo/app" element={<ProtectedRoute><TadGoApp /></ProtectedRoute>} />
          <Route path="/tadgo/dashboard" element={<ProtectedRoute><TadGoDriverDashboard /></ProtectedRoute>} />
          <Route path="/tadgo/task/:id" element={<ProtectedRoute><TadGoTaskDetail /></ProtectedRoute>} />
          
          {/* Gym Timer */}
          <Route path="/gym" element={<GymTimer />} />
          
          <Route path="/chattest" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
