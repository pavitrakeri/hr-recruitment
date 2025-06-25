import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MailCheck, ArrowLeft, CheckCircle, LogIn, UserPlus, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { clearAllAuthData } from "@/lib/utils";

const CandidateAuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [showEmailSent, setShowEmailSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [signInData, setSignInData] = useState({
    email: "",
    password: ""
  });

  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: ""
  });

  // Forgot password states
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Clear form data function
  const clearSignUpForm = () => {
    setSignUpData({
      email: "",
      password: "",
      fullName: "",
      phone: ""
    });
  };

  const clearSignInForm = () => {
    setSignInData({
      email: "",
      password: ""
    });
  };

  const handleAuthSuccess = () => {
    const params = new URLSearchParams(location.search);
    const redirectUrl = params.get('redirect');
    if (redirectUrl) {
      navigate(redirectUrl);
    } else {
      navigate('/candidate/applications');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      clearAllAuthData();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });
      if (error) throw error;

      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (!profile) {
        // Insert profile if not exists
        const { error: insertError } = await supabase
          .from('candidate_profiles')
          .insert({
            id: data.user.id,
            full_name: signInData.email.split('@')[0],
            email: signInData.email,
            phone: signUpData.phone || null,
          });
        if (insertError) throw insertError;
      }

      toast({ title: "Signed In", description: "You have been signed in successfully." });
      clearSignInForm();
      handleAuthSuccess();
    } catch (error: any) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Check if email exists in profiles (HR)
      const { data: hrProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', signUpData.email)
        .single();
      if (hrProfile) {
        toast({ title: "Sign up failed", description: "This email is already registered as an HR.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      clearAllAuthData();
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/candidate`,
          data: {
            full_name: signUpData.fullName,
            user_type: 'candidate',
            phone: signUpData.phone,
          }
        }
      });
      if (error) throw error;
      if (data.user && !data.user.email_confirmed_at) {
        setVerificationEmail(signUpData.email);
        setShowEmailSent(true);
        toast({ title: "Verification email sent, please check your inbox." });
      }
      clearSignUpForm();
    } catch (error: any) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/candidate/reset-password`
      });
      setShowForgot(false);
      setForgotEmail("");
      toast({ title: "Check your email for a password reset link." });
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) return;
    try {
      await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/candidate`
        }
      });
      toast({ title: "Verification email sent again." });
    } catch (error: any) {
      toast({
        title: "Failed to resend email",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Check for email verification on component mount
  useEffect(() => {
    clearAllAuthData();
  }, []);

  if (showEmailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to <strong>{verificationEmail}</strong>. Please check your inbox and click the link to activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button onClick={() => setShowEmailSent(false)} className="w-full">Back to Sign In</Button>
            <Button variant="outline" onClick={handleResendVerification} className="w-full">Resend Verification Email</Button>
            <p className="text-sm text-gray-500 mt-4">
              Already verified? <a href="/candidate" className="text-blue-600 hover:underline">Refresh and sign in</a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-md shadow-xl rounded-3xl border-0 p-6">
        <CardHeader className="text-center flex flex-col items-center">
          <img src="/aimploy-wordmark.png" alt="Aimploy" className="mx-auto h-12 w-auto mb-4" />
          <CardTitle className="text-3xl font-bold tracking-tight text-gray-800">Candidate Portal</CardTitle>
          <CardDescription>Access your applications and profile</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2 bg-blue-50 rounded-xl p-1">
              <TabsTrigger value="signin" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 transition-all">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 transition-all">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              {showForgot ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    className="flex items-center text-blue-600 hover:underline mb-4"
                    onClick={() => setShowForgot(false)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Sign In
                  </button>
                  <form onSubmit={handleForgotRequest} className="space-y-5">
                    <div className="space-y-2 relative">
                      <Label htmlFor="forgot-email">Email</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="your@email.com"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        required
                        className="pl-10 rounded-xl focus:ring-2 focus:ring-blue-200 bg-blue-50/50"
                      />
                    </div>
                    <Button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-300 to-purple-200 text-blue-900 font-semibold shadow hover:from-blue-200 hover:to-purple-100 transition-all" disabled={forgotLoading}>
                      <MailCheck className="w-4 h-4 mr-2" />
                      {forgotLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </form>
                </div>
              ) : (
                 <form onSubmit={handleSignIn} className="space-y-5">
                   <div className="space-y-2 relative">
                     <Label htmlFor="email">Email</Label>
                     <Input
                       id="email"
                       type="email"
                       placeholder="your@email.com"
                       value={signInData.email}
                       onChange={e => setSignInData({ ...signInData, email: e.target.value })}
                       required
                       className="pl-10 rounded-xl focus:ring-2 focus:ring-blue-200 bg-blue-50/50"
                     />
                   </div>
                   <div className="space-y-2 relative">
                     <Label htmlFor="password">Password</Label>
                     <Input
                       id="password"
                       type="password"
                       placeholder="Enter your password"
                       value={signInData.password}
                       onChange={e => setSignInData({ ...signInData, password: e.target.value })}
                       required
                       className="pl-10 rounded-xl focus:ring-2 focus:ring-blue-200 bg-blue-50/50"
                     />
                   </div>
                   <Button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all" disabled={isLoading}>
                    <LogIn className="w-4 h-4 mr-2" />
                     {isLoading ? "Signing in..." : "Sign In"}
                   </Button>
                   <div className="text-center mt-2">
                     <button
                       type="button"
                       className="text-sm text-blue-600 hover:underline"
                       onClick={() => setShowForgot(true)}
                     >
                       Forgot your password?
                     </button>
                   </div>
                 </form>
              )}
            </TabsContent>
            <TabsContent value="signup">
               <form onSubmit={handleSignUp} className="space-y-4">
                 <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                     <Label htmlFor="fullName">Full Name</Label>
                     <Input
                       id="fullName"
                       type="text"
                       placeholder="John Doe"
                       value={signUpData.fullName}
                       onChange={e => setSignUpData({ ...signUpData, fullName: e.target.value })}
                       required
                       className="rounded-xl focus:ring-2 focus:ring-blue-200 bg-blue-50/50"
                     />
                   </div>
                   <div className="space-y-2 relative">
                     <Label htmlFor="signup-email">Email</Label>
                     <Input
                       id="signup-email"
                       type="email"
                       placeholder="your@email.com"
                       value={signUpData.email}
                       onChange={e => setSignUpData({ ...signUpData, email: e.target.value })}
                       required
                       className="pl-10 rounded-xl focus:ring-2 focus:ring-blue-200 bg-blue-50/50"
                     />
                   </div>
                    <div className="space-y-2">
                     <Label htmlFor="phone">Phone (optional)</Label>
                     <Input
                       id="phone"
                       type="tel"
                       placeholder="+1 (555) 123-4567"
                       value={signUpData.phone}
                       onChange={e => setSignUpData({ ...signUpData, phone: e.target.value })}
                       className="rounded-xl focus:ring-2 focus:ring-blue-200 bg-blue-50/50"
                     />
                   </div>
                   <div className="space-y-2 relative">
                     <Label htmlFor="signup-password">Password</Label>
                     <Input
                       id="signup-password"
                       type="password"
                       placeholder="Create a strong password"
                       value={signUpData.password}
                       onChange={e => setSignUpData({ ...signUpData, password: e.target.value })}
                       required
                       className="pl-10 rounded-xl focus:ring-2 focus:ring-blue-200 bg-blue-50/50"
                     />
                   </div>
                 </div>
                 <Button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-green-400 to-teal-400 text-white font-semibold shadow-lg hover:from-green-500 hover:to-teal-500 transition-all" disabled={isLoading}>
                  <UserPlus className="w-4 h-4 mr-2" />
                   {isLoading ? "Creating account..." : "Create Account"}
                 </Button>
               </form>
            </TabsContent>
          </Tabs>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Are you an HR?{" "}
              <a href="/hr" className="text-blue-600 hover:underline">
                Go to HR Portal
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidateAuthForm; 