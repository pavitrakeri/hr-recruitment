import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "@/components/AuthForm";
import { NewHRDashboard } from "@/components/NewHRDashboard";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Handle email verification redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get('verified');
    
    if (verified === 'true') {
      // Redirect to login page with verification success message
      navigate('/hr?verified=true');
      // Clean up URL
      window.history.replaceState({}, document.title, '/hr');
    }
  }, [navigate]);

  useEffect(() => {
    if (!loading && user && user.user_metadata.user_type !== "hr") {
      // Log out and redirect to home or show error
      signOut();
      navigate("/hr?error=not_hr");
    }
  }, [user, loading, signOut, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show login form
  if (!user) {
    return <AuthForm />;
  }

  // If user is authenticated but email is not confirmed, show login form
  if (!user.email_confirmed_at) {
    return <AuthForm />;
  }

  return <NewHRDashboard />;
};

export default Index;
