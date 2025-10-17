
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
import Kenya from "./pages/Kenya";
import IdOc from "./pages/IdOc";
import IdIc from "./pages/IdIc";
import PhIc from "./pages/PhIc";
import PhOc from "./pages/PhOc";
import EtIc from "./pages/EtIc";
import EtOc from "./pages/EtOc";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";

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
          <Route path="/kenya" element={<Kenya />} />
          <Route path="/id-oc" element={<IdOc />} />
          <Route path="/id-ic" element={<IdIc />} />
          <Route path="/ph-ic" element={<PhIc />} />
          <Route path="/ph-oc" element={<PhOc />} />
          <Route path="/et-ic" element={<EtIc />} />
          <Route path="/et-oc" element={<EtOc />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
