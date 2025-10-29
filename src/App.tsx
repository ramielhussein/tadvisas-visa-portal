
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import CreateDeal from "./pages/CreateDeal";
import FinancialDashboard from "./pages/FinancialDashboard";
import SuppliersManagement from "./pages/SuppliersManagement";
import WizardAlbum from "./pages/WizardAlbum";
import RefundsList from "./pages/RefundsList";
import SiteGuide from "./pages/SiteGuide";
import ContractManagement from "./pages/ContractManagement";
import CreateContract from "./pages/CreateContract";
import RefundsApproval from "./pages/RefundsApproval";
import ProductDashboard from "./pages/ProductDashboard";
import PurchaseOrders from "./pages/PurchaseOrders";
import DailyHeadcount from "./pages/DailyHeadcount";
import MyCVs from "./pages/MyCVs";
import ExpenseCategoriesManagement from "./pages/ExpenseCategoriesManagement";
import ExpensesManagement from "./pages/ExpensesManagement";
import BankTransfers from "./pages/BankTransfers";
import BankAccountsManagement from "./pages/BankAccountsManagement";
import EquityAccountsManagement from "./pages/EquityAccountsManagement";
import OwnerEquity from "./pages/OwnerEquity";
import AuditLogs from "./pages/AuditLogs";
import InstallApp from "./pages/InstallApp";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
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
          <Route path="/admin/reset-admin" element={<ResetAdmin />} />
          <Route path="/crm/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/crm/leads" element={<ProtectedRoute><LeadManagement /></ProtectedRoute>} />
          <Route path="/crm/leads/:id" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
          <Route path="/deals" element={<ProtectedRoute><DealsManagement /></ProtectedRoute>} />
          <Route path="/deals/create" element={<ProtectedRoute><CreateDeal /></ProtectedRoute>} />
          <Route path="/financial" element={<ProtectedRoute><FinancialDashboard /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute><SuppliersManagement /></ProtectedRoute>} />
          <Route path="/wizardalbum" element={<WizardAlbum />} />
          <Route path="/refundslist" element={<ProtectedRoute><RefundsList /></ProtectedRoute>} />
          <Route path="/refunds-approval" element={<ProtectedRoute><RefundsApproval /></ProtectedRoute>} />
          <Route path="/siteguide" element={<ProtectedRoute><SiteGuide /></ProtectedRoute>} />
          <Route path="/contracts" element={<ProtectedRoute><ContractManagement /></ProtectedRoute>} />
          <Route path="/contracts/create" element={<ProtectedRoute><CreateContract /></ProtectedRoute>} />
          <Route path="/my-cvs" element={<ProtectedRoute><MyCVs /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><ExpensesManagement /></ProtectedRoute>} />
          <Route path="/expense-categories" element={<ProtectedRoute><ExpenseCategoriesManagement /></ProtectedRoute>} />
          <Route path="/bank-accounts" element={<ProtectedRoute><BankAccountsManagement /></ProtectedRoute>} />
          <Route path="/bank-transfers" element={<ProtectedRoute><BankTransfers /></ProtectedRoute>} />
          <Route path="/equity-accounts" element={<ProtectedRoute><EquityAccountsManagement /></ProtectedRoute>} />
          <Route path="/owner-equity" element={<ProtectedRoute><OwnerEquity /></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
          <Route path="/install" element={<InstallApp />} />
          
          {/* Product Management Routes */}
          <Route path="/product/dashboard" element={<ProtectedRoute><ProductDashboard /></ProtectedRoute>} />
          <Route path="/product/purchase-orders" element={<ProtectedRoute><PurchaseOrders /></ProtectedRoute>} />
          <Route path="/product/daily-headcount" element={<ProtectedRoute><DailyHeadcount /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
