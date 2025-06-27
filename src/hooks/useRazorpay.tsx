import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionPlan } from '@/integrations/supabase/types';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

export const useRazorpay = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createRazorpayOrder = async (plan: SubscriptionPlan, userEmail: string) => {
    setLoading(true);
    try {
      // Create order on backend using Supabase Edge Function
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: Math.round(plan.price * 100), // Razorpay expects amount in paise (smallest currency unit)
          currency: 'INR',
          planId: plan.id,
          planName: plan.name,
          userEmail: userEmail,
        }
      });

      if (orderError) {
        throw new Error(orderError.message || 'Failed to create payment order');
      }

      return orderData;
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Could not create a payment order. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async (plan: SubscriptionPlan, userEmail: string, onSuccess: (planId: string) => void) => {
    try {
      const orderData = await createRazorpayOrder(plan, userEmail);

      const options: RazorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'AImploy',
        description: `Subscribe to ${plan.name} Plan`,
        order_id: orderData.id,
        prefill: {
          email: userEmail,
        },
        theme: {
          color: "#6366f1"
        },
        modal: {
          ondismiss: () => {
            toast({
              title: "Payment Cancelled",
              description: "You can try again anytime.",
              variant: "default"
            });
          }
        },
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: plan.id,
                userEmail: userEmail,
              }
            });

            if (verificationError) {
              throw new Error(verificationError.message || 'Payment verification failed');
            }

            // Call the success callback to activate subscription
            await onSuccess(plan.id);
            
            toast({
              title: "Payment Successful!",
              description: `You are now subscribed to the ${plan.name} plan.`,
            });
          } catch (error: any) {
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Please contact support if the amount was deducted.",
              variant: "destructive"
            });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      // Error already handled in createRazorpayOrder
      console.error('Razorpay payment initiation failed:', error);
    }
  };

  const verifyPaymentSignature = (orderId: string, paymentId: string, signature: string, secret: string) => {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    
    return expectedSignature === signature;
  };

  return {
    loading,
    initiatePayment,
    createRazorpayOrder,
    verifyPaymentSignature,
  };
}; 