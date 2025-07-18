import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface SubscriptionContextType {
  isPro: boolean;
  isLoading: boolean;
  subscription: any;
  proFeatures: {
    deepAnalytics: boolean;
    advancedReports: boolean;
    automationEngine: boolean;
    memberInsights: boolean;
    bulkOperations: boolean;
    customBranding: boolean;
    apiAccess: boolean;
  };
  checkProFeature: (feature: string) => boolean;
  upgradePrompt: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  const proFeatures = {
    deepAnalytics: isPro,
    advancedReports: isPro,
    automationEngine: isPro,
    memberInsights: isPro,
    bulkOperations: isPro,
    customBranding: isPro,
    apiAccess: isPro,
  };

  useEffect(() => {
    // Get user directly from supabase instead of useAuth
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          checkSubscription(user);
        } else {
          setIsPro(false);
          setSubscription(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error getting user in SubscriptionProvider:', error);
        setIsLoading(false);
      }
    };

    getUser();
  }, []);

  const checkSubscription = async (currentUser: any) => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      
      // Check if user has an active subscription
      // Note: subscriptions table uses member_id, so we need to find the member first
      const { data: memberData } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();

      if (!memberData) {
        setIsPro(false);
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('member_id', memberData.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setIsPro(true);
        setSubscription(data[0]);
      } else {
        // Check if it's a demo/trial account with pro features
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier, trial_ends_at')
          .eq('id', currentUser.id)
          .single();

        if (profile) {
          const isTrialActive = profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date();
          setIsPro(profile.subscription_tier === 'pro' || isTrialActive);
          setSubscription(profile);
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkProFeature = (feature: string): boolean => {
    return proFeatures[feature as keyof typeof proFeatures] || false;
  };

  const upgradePrompt = () => {
    // Show upgrade modal or redirect to pricing page
    window.open('/upgrade', '_blank');
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isPro,
        isLoading,
        subscription,
        proFeatures,
        checkProFeature,
        upgradePrompt,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
} 