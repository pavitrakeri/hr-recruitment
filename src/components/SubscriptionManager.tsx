import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap, CreditCard, Globe } from "lucide-react";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useJobs } from "@/hooks/useJobs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPlanPrice } from "@/lib/currency";

declare global {
  interface Window {
    Razorpay: any;
    Stripe: any;
  }
}

export function SubscriptionManager() {
  const { plans, userSubscription, loading, createSubscription, cancelSubscription, getJobLimit, refetch } = useSubscriptions();
  const { initiatePayment: initiateRazorpayPayment, loading: razorpayLoading } = useRazorpay();
  const { jobs } = useJobs();
  const { toast } = useToast();
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'razorpay'>('stripe');
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("success")) {
      toast({
        title: "Subscription successful!",
        description: "Your plan has been upgraded.",
      });
      searchParams.delete("success");
      setSearchParams(searchParams);
    }
    if (searchParams.get("canceled")) {
      toast({
        title: "Subscription canceled",
        description: "Your payment was not completed.",
        variant: "destructive",
      });
      searchParams.delete("canceled");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams, toast]);

  const handleSubscribe = async (planId: string) => {
    setProcessing(planId);
    try {
      await createSubscription(planId);
    } catch (error) {
      // Error handled by hook
    } finally {
      setProcessing(null);
    }
  };

  const handleCancel = async () => {
    setProcessing('cancel');
    try {
      await cancelSubscription();
    } catch (error) {
      // Error handled by hook
    } finally {
      setProcessing(null);
    }
  };

  const getCurrentPlan = () => {
    if (!userSubscription) return plans.find(p => p.name === 'Free');
    return plans.find(p => p.id === userSubscription.plan_id);
  };

  const currentPlan = getCurrentPlan();
  const currentJobCount = jobs.length;
  const jobLimit = getJobLimit();

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free': return <Star className="w-5 h-5" />;
      case 'pro': return <Zap className="w-5 h-5" />;
      case 'business': return <Crown className="w-5 h-5" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'business': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePayment = async (plan) => {
    if (selectedPaymentMethod === 'razorpay') {
      await handleRazorpayPayment(plan);
    } else {
      await handleStripeCheckout(plan);
    }
  };

  const handleRazorpayPayment = async (plan) => {
    setProcessing(plan.id);
    try {
      await initiateRazorpayPayment(plan, user?.email || '', async () => {
        await refetch();
      });
    } catch (error) {
      // Error handled by hook
    } finally {
      setProcessing(null);
    }
  };

  const handleStripeCheckout = async (plan) => {
    setProcessing(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: { planId: plan.id, userId: user.id }
      });

      if (error) throw new Error(error.message);

      const stripe = window.Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      await stripe.redirectToCheckout({ sessionId: data.sessionId });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not initiate checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card className="bg-white/80 shadow-xl rounded-3xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Current Subscription
          </CardTitle>
          <CardDescription>
            Manage your subscription and view usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white/60 rounded-2xl">
              <div className="text-2xl font-bold text-blue-900">
                {currentPlan?.name || 'Free'}
              </div>
              <div className="text-sm text-gray-700">Current Plan</div>
            </div>
            <div className="text-center p-4 bg-white/60 rounded-2xl">
              <div className="text-2xl font-bold text-blue-600">
                {currentJobCount}
              </div>
              <div className="text-sm text-gray-700">Active Jobs</div>
            </div>
            <div className="text-center p-4 bg-white/60 rounded-2xl">
              <div className="text-2xl font-bold text-green-600">
                {jobLimit}
              </div>
              <div className="text-sm text-gray-700">Job Limit</div>
            </div>
          </div>
          
          {userSubscription && (
            <div className="mt-4 p-4 bg-white/60 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-yellow-800">Subscription Active</h4>
                  <p className="text-sm text-yellow-700">
                    Renews on {new Date(userSubscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCancel}
                  disabled={processing === 'cancel'}
                >
                  {processing === 'cancel' ? 'Cancelling...' : 'Cancel Subscription'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card className="bg-white/80 shadow-xl rounded-3xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </CardTitle>
          <CardDescription>
            Choose your preferred payment method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="stripe"
                name="paymentMethod"
                value="stripe"
                checked={selectedPaymentMethod === 'stripe'}
                onChange={(e) => setSelectedPaymentMethod(e.target.value as 'stripe' | 'razorpay')}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="stripe" className="flex items-center gap-2 cursor-pointer">
                <CreditCard className="w-4 h-4" />
                <span>Stripe (International)</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="razorpay"
                name="paymentMethod"
                value="razorpay"
                checked={selectedPaymentMethod === 'razorpay'}
                onChange={(e) => setSelectedPaymentMethod(e.target.value as 'stripe' | 'razorpay')}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="razorpay" className="flex items-center gap-2 cursor-pointer">
                <Globe className="w-4 h-4" />
                <span>Razorpay (India)</span>
              </label>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {selectedPaymentMethod === 'razorpay' 
              ? 'Pay in INR using UPI, cards, net banking, and wallets'
              : 'Pay in USD using international cards and payment methods'
            }
          </div>
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <Card className="bg-white/80 shadow-xl rounded-3xl border-0">
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Choose the plan that best fits your hiring needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = currentPlan?.id === plan.id;
              const isUpgrade = currentPlan && plan.price > currentPlan.price;
              const isDowngrade = currentPlan && plan.price < currentPlan.price;
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative bg-white/80 shadow-xl rounded-3xl border-0 ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600">Current Plan</Badge>
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPlanIcon(plan.name)}
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {formatPlanPrice(plan.price, selectedPaymentMethod === 'razorpay' ? 'INR' : 'USD')}
                        </div>
                        <div className="text-sm text-gray-500">per month</div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{plan.job_limit} job postings</span>
                      </div>
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-4">
                      {isCurrentPlan ? (
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          disabled
                        >
                          Current Plan
                        </Button>
                      ) : (
                        <Button 
                          className={`w-full ${
                            isUpgrade ? 'bg-blue-600 hover:bg-blue-700' : 
                            isDowngrade ? 'bg-gray-600 hover:bg-gray-700' : 
                            'bg-green-600 hover:bg-green-700'
                          }`}
                          onClick={() => handlePayment(plan)}
                          disabled={processing === plan.id || razorpayLoading}
                        >
                          {processing === plan.id || razorpayLoading ? 'Processing...' : 
                           isUpgrade ? 'Upgrade' : 
                           isDowngrade ? 'Downgrade' : 
                           'Subscribe'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Usage Warning */}
      {currentJobCount >= jobLimit && (
        <Card className="bg-white/80 shadow-xl rounded-3xl border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <Star className="w-5 h-5" />
              <div>
                <h4 className="font-medium">Job Limit Reached</h4>
                <p className="text-sm">
                  You've reached your limit of {jobLimit} job postings. 
                  {currentPlan?.name !== 'Business' && ' Consider upgrading your plan to post more jobs.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 