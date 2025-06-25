import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import SessionExpiryNotification from "@/components/SessionExpiryNotification";
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import JobApplication from "./pages/JobApplication";
import NotFound from "./pages/NotFound";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import ResetPassword from "./pages/ResetPassword";
import CandidatePortal from "./pages/CandidatePortal";
import CandidateResetPassword from "./pages/CandidateResetPassword";
import MyApplications from "./pages/MyApplications";
import SubmitAndTrack from "./pages/SubmitAndTrack";
import Settings from "./pages/Settings";
import ApplyForJob from "./pages/ApplyForJob";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SessionExpiryNotification />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/hr" element={<Index />} />
            <Route path="/job/:jobId" element={<JobApplication />} />
            <Route path="/job/:jobId/apply" element={<ApplyForJob />} />
            <Route path="/superadmin-login" element={<SuperAdminLogin />} />
            <Route path="/superadmin" element={<SuperAdminDashboardWrapper />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Candidate Portal Routes */}
            <Route path="/candidate" element={<CandidatePortal />} />
            <Route path="/candidate/applications" element={<MyApplications />} />
            <Route path="/candidate/submit" element={<SubmitAndTrack />} />
            <Route path="/candidate/settings" element={<Settings />} />
            <Route path="/candidate/reset-password" element={<CandidateResetPassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

// Protect SuperAdminDashboard route
function SuperAdminDashboardWrapper() {
  if (localStorage.getItem('superadmin') === 'true') {
    return <SuperAdminDashboard />;
  } else {
    window.location.href = '/superadmin-login';
    return null;
  }
}

export default App;
