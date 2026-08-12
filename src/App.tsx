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
import { TelegramAutoAuthGate } from "@/components/TelegramAutoAuthGate";
import { ModeGuard } from "@/components/ModeGuard";

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
        <TelegramAutoAuthGate>
        <Routes>
          {/* Main app routes */}
          <Route path="/" element={<Home />} />
          <Route path="/analyze" element={<ModeGuard requires="b2c"><Analyze /></ModeGuard>} />
          <Route path="/results" element={<ModeGuard requires="b2c"><Results /></ModeGuard>} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/tariffs" element={<ModeGuard requires="b2c"><Tariffs /></ModeGuard>} />
          <Route path="/pay/:orderId" element={<ModeGuard requires="b2c"><Pay /></ModeGuard>} />
          <Route path="/my-reports" element={<ModeGuard requires="b2c"><MyReports /></ModeGuard>} />

          {/* Partner routes (hidden from menu, accessible by direct URL) */}
          <Route path="/partner/register" element={<ModeGuard requires="b2b"><PartnerRegister /></ModeGuard>} />
          <Route path="/partner/login" element={<ModeGuard requires="b2b"><PartnerLogin /></ModeGuard>} />
          <Route path="/partner/dashboard" element={<ModeGuard requires="b2b"><PartnerDashboard /></ModeGuard>} />

          {/* Clinic branded routes */}
          <Route path="/c/:slug" element={<ModeGuard requires="b2b"><ClinicHome /></ModeGuard>} />
          <Route path="/c/:slug/analyze" element={<ModeGuard requires="b2b"><ClinicAnalyze /></ModeGuard>} />
          <Route path="/c/:slug/results" element={<ModeGuard requires="b2b"><ClinicResults /></ModeGuard>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
        </TelegramAutoAuthGate>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
