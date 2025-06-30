import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionPlan, UserSubscription } from '@/integrations/supabase/types';

export const useSubscriptions = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading subscription plans",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchUserSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      setUserSubscription(data);
    } catch (error: any) {
      toast({
        title: "Error loading subscription",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (planId: string) => {
    if (!user) return;

    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');

      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert([{
          user_id: user.id,
          plan_id: planId,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      setUserSubscription(data);
      toast({
        title: "Subscription created successfully!",
        description: `You are now subscribed to the ${plan.name} plan.`,
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error creating subscription",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const cancelSubscription = async () => {
    if (!userSubscription) return;

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', userSubscription.id);

      if (error) throw error;

      setUserSubscription({ ...userSubscription, status: 'cancelled' });
      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error cancelling subscription",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const canCreateJob = (currentJobCount: number) => {
    if (loading) return true; // Don't block creation while loading
    if (!userSubscription) {
      // Free tier: check against free plan's job limit
      const freePlan = plans.find(p => p.name.toLowerCase() === 'free');
      if (!freePlan) return true; // If no free plan defined, allow creation
      return currentJobCount < (freePlan.job_limit || 1);
    }
    const plan = plans.find(p => p.id === userSubscription.plan_id);
    if (!plan) return true; // If plan not found, allow creation
    return currentJobCount < plan.job_limit;
  };

  const getJobLimit = () => {
    if (!userSubscription) return 1; // Free tier
    const plan = plans.find(p => p.id === userSubscription.plan_id);
    return plan?.job_limit || 1;
  };

  useEffect(() => {
    fetchPlans();
    fetchUserSubscription();
  }, [user]);

  return {
    plans,
    userSubscription,
    loading,
    createSubscription,
    cancelSubscription,
    canCreateJob,
    getJobLimit,
    refetch: fetchUserSubscription,
  };
}; 