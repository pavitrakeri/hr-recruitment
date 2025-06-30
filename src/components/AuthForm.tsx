import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, LogIn, UserPlus, KeyRound, MailCheck, ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { clearAllAuthData } from "@/lib/utils";

const AuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [showEmailSent, setShowEmailSent] = useState(false);
  const { toast } = useToast();

  const [signInData, setSignInData] = useState({
    email: "",
    password: ""
  });

  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    fullName: "",
    companyName: ""
  });

  // Forgot password states
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request'|'otp'|'reset'|null>('request');
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Clear form data function
  const clearSignUpForm = () => {
    setSignUpData({
      email: "",
      password: "",
      fullName: "",
      companyName: ""
    });
  };

  const clearSignInForm = () => {
    setSignInData({
      email: "",
      password: ""
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Clear any existing session data before signing in
      clearAllAuthData();
      
      const { error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Check if email exists in candidate_profiles
      const { data: candidateProfile } = await supabase
        .from('candidate_profiles')
        .select('id')
        .eq('email', signUpData.email)
        .single();
      if (candidateProfile) {
        toast({ title: "Sign up failed", description: "This email is already registered as a candidate.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      // Clear any existing session data before signing up
      clearAllAuthData();
      const { error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/hr?verified=true`,
          data: {
            full_name: signUpData.fullName,
            user_type: 'hr',
            company_name: signUpData.companyName,
          }
        }
      });
      if (error) throw error;
      // Clear form data and show success message
      clearSignUpForm();
      setShowEmailSent(true);
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email verification success
  const handleEmailVerified = () => {
    setShowEmailSent(false);
    setActiveTab("signin");
    toast({
      title: "Email verified!",
      description: "Please sign in with your credentials.",
    });
  };

  // Simulate OTP for demo (in real app, use backend/email)
  const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      setForgotStep('request');
      setShowForgot(false);
      setOtp("");
      setEnteredOtp("");
      setNewPassword("");
      setForgotEmail("");
      toast({ title: "Check your email for a password reset link." });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp === otp) {
      setForgotStep('reset');
      toast({ title: "OTP verified!", description: "You can now set a new password." });
    } else {
      toast({ title: "Invalid OTP", description: "Please check the OTP and try again.", variant: "destructive" });
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      setForgotStep('request');
      setShowForgot(false);
      setOtp("");
      setEnteredOtp("");
      setNewPassword("");
      setForgotEmail("");
      toast({ title: "Password reset!", description: "You can now sign in with your new password." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  };

  // Check if user came from email verification
  const checkEmailVerification = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get('verified');
    if (verified === 'true') {
      handleEmailVerified();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Check for email verification on component mount
  useEffect(() => {
    checkEmailVerification();
    
    // Clear any existing session data when the auth form is shown
    // This ensures fresh login is required
    clearAllAuthData();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-md shadow-xl rounded-3xl border-0 p-6">
        <CardHeader className="text-center flex flex-col items-center">
          <img src="/aimploy-wordmark.png" alt="AImploy" className="w-44 h-auto mb-2" />
          <div className="w-16 border-b-2 border-blue-200 mb-4" />
          <CardDescription className="text-base text-gray-500 mb-2">
            AI-powered recruitment platform for modern teams
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showEmailSent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Check Your Email</h3>
                <p className="text-gray-600 mb-4">
                  We've sent a verification link to <strong>{signUpData.email}</strong>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Click the link in your email to verify your account, then come back to sign in.
                </p>
              </div>
              <div className="space-y-3">
                <Button 
                  onClick={() => setShowEmailSent(false)} 
                  className="w-full"
                >
                  Back to Sign In
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Resend verification email
                    supabase.auth.resend({
                      type: 'signup',
                      email: signUpData.email,
                      options: {
                        emailRedirectTo: `${window.location.origin}/hr?verified=true`
                      }
                    });
                    toast({
                      title: "Email resent!",
                      description: "Check your inbox for the verification link.",
                    });
                  }}
                  className="w-full"
                >
                  Resend Email
                </Button>
              </div>
            </div>
          ) : (
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
                      onClick={() => { setShowForgot(false); setForgotStep('request'); }}
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" /> Back to Sign In
                    </button>
                    {forgotStep === 'request' && (
                      <form onSubmit={handleForgotRequest} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="forgot-email">Email</Label>
                          <Input
                            id="forgot-email"
                            type="email"
                            placeholder="your@company.com"
                            value={forgotEmail}
                            onChange={e => setForgotEmail(e.target.value)}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={forgotLoading}>
                          <MailCheck className="w-4 h-4 mr-2" />
                          {forgotLoading ? "Sending..." : "Send Reset Link"}
                        </Button>
                      </form>
                    )}
                    {forgotStep === 'otp' && (
                      <form onSubmit={handleOtpVerify} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="otp">Enter OTP</Label>
                          <Input
                            id="otp"
                            type="text"
                            placeholder="6-digit code"
                            value={enteredOtp}
                            onChange={e => setEnteredOtp(e.target.value)}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={forgotLoading}>
                          <KeyRound className="w-4 h-4 mr-2" />
                          {forgotLoading ? "Verifying..." : "Verify OTP"}
                        </Button>
                      </form>
                    )}
                    {forgotStep === 'reset' && (
                      <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input
                            id="new-password"
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={forgotLoading}>
                          <KeyRound className="w-4 h-4 mr-2" />
                          {forgotLoading ? "Resetting..." : "Reset Password"}
                        </Button>
                      </form>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSignIn} className="space-y-5">
                    <div className="space-y-2 relative">
                      <Label htmlFor="signin-email">Email</Label>
                      <span className="absolute left-3 top-9 text-blue-300">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M4 4h16v16H4z"/><path stroke="currentColor" strokeWidth="2" d="M4 4l8 8 8-8"/></svg>
                      </span>
                      <Input id="signin-email" type="email" placeholder="your@company.com" value={signInData.email} onChange={e => setSignInData({ ...signInData, email: e.target.value })} required className="pl-10 rounded-xl focus:ring-2 focus:ring-blue-200 bg-blue-50/50" />
                    </div>
                    <div className="space-y-2 relative">
                      <Label htmlFor="signin-password">Password</Label>
                      <span className="absolute left-3 top-9 text-blue-300">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 17v.01"/><rect width="14" height="10" x="5" y="11" rx="2" stroke="currentColor" strokeWidth="2"/><path stroke="currentColor" strokeWidth="2" d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </span>
                      <Input id="signin-password" type="password" value={signInData.password} onChange={e => setSignInData({ ...signInData, password: e.target.value })} required className="pl-10 rounded-xl focus:ring-2 focus:ring-blue-200 bg-blue-50/50" />
                    </div>
                    <Button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-300 to-purple-200 text-blue-900 font-semibold shadow hover:from-blue-200 hover:to-purple-100 transition-all" disabled={isLoading}>
                      <LogIn className="w-4 h-4 mr-2" />
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                    <div className="text-right mt-2">
                      <button type="button" className="text-blue-500 hover:underline text-sm" onClick={() => { setShowForgot(true); setForgotStep('request'); }}>
                        Forgot Password?
                      </button>
                    </div>
                  </form>
                )}
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="space-y-2 relative">
                    <Label htmlFor="signup-fullname">Full Name</Label>
                    <Input id="signup-fullname" placeholder="John Doe" value={signUpData.fullName} onChange={e => setSignUpData({ ...signUpData, fullName: e.target.value })} required className="rounded-xl focus:ring-2 focus:ring-blue-200 bg-blue-50/50" />
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="signup-company">Company Name</Label>
                    <Input id="signup-company" placeholder="Your Company" value={signUpData.companyName} onChange={e => setSignUpData({ ...signUpData, companyName: e.target.value })} required className="rounded-xl focus:ring-2 focus:ring-blue-200 bg-blue-50/50" />
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="signup-email">Email</Label>
                    <span className="absolute left-3 top-9 text-blue-300">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M4 4h16v16H4z"/><path stroke="currentColor" strokeWidth="2" d="M4 4l8 8 8-8"/></svg>
                    </span>
                    <Input id="signup-email" type="email" placeholder="your@company.com" value={signUpData.email} onChange={e => setSignUpData({ ...signUpData, email: e.target.value })} required className="pl-10 rounded-xl focus:ring-2 focus:ring-blue-200 bg-blue-50/50" />
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="signup-password">Password</Label>
                    <span className="absolute left-3 top-9 text-blue-300">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 17v.01"/><rect width="14" height="10" x="5" y="11" rx="2" stroke="currentColor" strokeWidth="2"/><path stroke="currentColor" strokeWidth="2" d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </span>
                    <Input id="signup-password" type="password" value={signUpData.password} onChange={e => setSignUpData({ ...signUpData, password: e.target.value })} required className="pl-10 rounded-xl focus:ring-2 focus:ring-blue-200 bg-blue-50/50" />
                  </div>
                  <Button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-300 to-purple-200 text-blue-900 font-semibold shadow hover:from-blue-200 hover:to-purple-100 transition-all" disabled={isLoading}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isLoading ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Are you a job seeker?{" "}
              <a href="/candidate" className="text-blue-600 hover:underline">
                Go to Candidate Portal
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthForm;
