import { useAuth } from "@/hooks/useAuth";
import CandidateAuthForm from "@/components/CandidateAuthForm";
import CandidateDashboard from "@/components/CandidateDashboard";
import { CandidateSidebar } from "@/components/CandidateSidebar";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const CandidatePortal = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && user && user.user_metadata.user_type !== "candidate") {
      navigate("/candidate", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your portal...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated and email is verified
  if (!user || !user.email_confirmed_at) {
    return <CandidateAuthForm />;
  }

  // The redirect will happen in useEffect for unauthorized users

  return (
    <div className="flex bg-gradient-to-br from-blue-100 via-white to-purple-100 min-h-screen">
      <CandidateSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <main className="flex-1 lg:ml-64">
        {isMobile && (
          <div className="flex items-center h-16 px-4 border-b border-gray-200 bg-white/80 sticky top-0 z-40">
            <Button variant="ghost" className="mr-2" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6 text-blue-900" />
            </Button>
            <span className="text-lg font-bold text-blue-900">Dashboard</span>
          </div>
        )}
        <CandidateDashboard />
      </main>
    </div>
  );
};

export default CandidatePortal; 