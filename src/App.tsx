import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Analyze from "./pages/Analyze";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";
import Tariffs from "./pages/Tariffs";
import Pay from "./pages/Pay";
import MyReports from "./pages/MyReports";

// Partner pages
import PartnerRegister from "./pages/partner/Register";
import PartnerLogin from "./pages/partner/Login";
import PartnerDashboard from "./pages/partner/Dashboard";

// Clinic branded pages
import ClinicHome from "./pages/clinic/Home";
import ClinicAnalyze from "./pages/clinic/Analyze";
import ClinicResults from "./pages/clinic/Results";

import { useReferralCapture } from "@/hooks/useReferral";

const queryClient = new QueryClient();

function ReferralCaptureMount() {
  useReferralCapture();
  return null;
}


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ReferralCaptureMount />
        <Routes>
          {/* Main app routes */}
          <Route path="/" element={<Home />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/results" element={<Results />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/tariffs" element={<Tariffs />} />
          <Route path="/pay/:orderId" element={<Pay />} />
          <Route path="/my-reports" element={<MyReports />} />
          
          {/* Partner routes (hidden from menu, accessible by direct URL) */}
          <Route path="/partner/register" element={<PartnerRegister />} />
          <Route path="/partner/login" element={<PartnerLogin />} />
          <Route path="/partner/dashboard" element={<PartnerDashboard />} />
          
          {/* Clinic branded routes */}
          <Route path="/c/:slug" element={<ClinicHome />} />
          <Route path="/c/:slug/analyze" element={<ClinicAnalyze />} />
          <Route path="/c/:slug/results" element={<ClinicResults />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
