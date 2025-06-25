import { useAuth } from "@/hooks/useAuth";
import CandidateAuthForm from "@/components/CandidateAuthForm";
import CandidateDashboard from "@/components/CandidateDashboard";
import { CandidateSidebar } from "@/components/CandidateSidebar";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CandidatePortal = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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
      <CandidateSidebar />
      <main className="flex-1 lg:ml-64">
        <CandidateDashboard />
      </main>
    </div>
  );
};

export default CandidatePortal; 