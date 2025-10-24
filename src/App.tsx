
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
import WizardAlbum from "./pages/WizardAlbum";

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
          <Route path="/admin" element={<Admin />} />
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
          <Route path="/crm/leads" element={<ProtectedRoute><LeadManagement /></ProtectedRoute>} />
          <Route path="/wizardalbum" element={<WizardAlbum />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
