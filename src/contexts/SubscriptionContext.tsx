/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, IS_MOCK_MODE } from "../supabaseClient";
import { isSubscriptionEntitled } from "../utils/subscriptionEntitlement";
import { planIncludesAnalytics } from "../utils/planFeatures";

interface Subscription {
  id: string;
  member_id: string;
  status: string;
  plan_type: string;
  created_at: string;
  expires_at?: string;
  trial_end?: string;
  /** While status is "past_due": access continues until this time. */
  grace_until?: string;
};

interface User {
  id: string;
  email?: string;
}

interface SubscriptionContextType {
  isPro: boolean;
  /** The gym's platform plan (starter, pro, ...), or null when unknown. */
  planTier: string | null;
  /** Analytics screens are part of Pro and above; false while the plan is loading. */
  canUseAnalytics: boolean;
  isLoading: boolean;
  subscription: Subscription | null;
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

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isPro, setIsPro] = useState(false);
  const [planTier, setPlanTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

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
    if (IS_MOCK_MODE) {
      // The demo gym is on the top plan unless a test (or you, in the console:
      // sessionStorage.setItem("mtdrb.demoPlan", "starter")) picks another.
      let demoTier = "enterprise";
      try {
        demoTier = window.sessionStorage.getItem("mtdrb.demoPlan") || demoTier;
      } catch {
        // storage unavailable: keep the default
      }
      setIsPro(demoTier === "pro" || demoTier === "enterprise");
      setPlanTier(demoTier);
      setSubscription({
        id: "localhost-subscription",
        member_id: "mock-member",
        status: "active",
        plan_type: demoTier,
        created_at: new Date().toISOString(),
      });
      setIsLoading(false);
      return;
    }

    // Get user directly from supabase instead of useAuth
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          checkSubscription(user);
        } else {
          setIsPro(false);
          setSubscription(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error getting user in SubscriptionProvider:", error);
        setIsLoading(false);
      }
    };

    void getUser();

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void checkSubscription(session?.user ?? null);
    });

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  const checkSubscription = async (currentUser: User | null) => {
    if (!currentUser) {
      setIsPro(false);
      setPlanTier(null);
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Get the tenant membership of the user first
      const { data: membershipData } = await supabase
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (!membershipData) {
        setIsPro(false);
        setPlanTier(null);
        return;
      }

      // Query platform_subscriptions for the tenant
      const { data: subData } = await supabase
        .from("platform_subscriptions")
        .select("*")
        .eq("tenant_id", membershipData.tenant_id)
        .maybeSingle();

      if (subData) {
        const isActive = isSubscriptionEntitled(subData);
        setIsPro(isActive && (subData.plan_tier === 'pro' || subData.plan_tier === 'enterprise'));
        setPlanTier(typeof subData.plan_tier === 'string' ? subData.plan_tier : null);
        setSubscription({
          id: subData.id,
          member_id: currentUser.id,
          status: subData.status,
          plan_type: subData.plan_tier,
          created_at: subData.created_at,
          expires_at: subData.current_period_end,
          trial_end: subData.trial_end,
          grace_until: subData.grace_until ?? undefined,
        });
      } else {
        // No platform_subscriptions row for this tenant: not entitled. Never
        // fall back to auth user_metadata (an email substring or a
        // client-editable field via supabase.auth.updateUser()) to decide
        // paid/Pro status -- that would let any signed-up user grant
        // themselves Pro access for free.
        setIsPro(false);
        setPlanTier(null);
        setSubscription(null);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setIsPro(false);
      setPlanTier(null);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  const checkProFeature = (): boolean => {
    return isPro;
  };

  const upgradePrompt = () => {
    // This would typically open a modal or redirect to upgrade page
  };

  const value: SubscriptionContextType = {
    isPro,
    planTier,
    canUseAnalytics: !isLoading && planIncludesAnalytics(planTier),
    isLoading,
    subscription,
    proFeatures,
    checkProFeature,
    upgradePrompt,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    console.warn("useSubscription was called outside of a SubscriptionProvider. Returning a fail-closed fallback context.");
    return {
      isPro: false,
      planTier: null,
      canUseAnalytics: false,
      isLoading: false,
      subscription: null,
      proFeatures: {
        deepAnalytics: false,
        advancedReports: false,
        automationEngine: false,
        memberInsights: false,
        bulkOperations: false,
        customBranding: false,
        apiAccess: false,
      },
      checkProFeature: () => false,
      upgradePrompt: () => {},
    };
  }
  return context;
}
