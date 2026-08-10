import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { isLocalhost } from "../utils/isLocalhost";

interface Subscription {
  id: string;
  member_id: string;
  status: string;
  plan_type: string;
  created_at: string;
  expires_at?: string;
}

interface User {
  id: string;
  email?: string;
}

interface SubscriptionContextType {
  isPro: boolean;
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
    if (isLocalhost()) {
      setIsPro(true);
      setSubscription({
        id: "localhost-subscription",
        member_id: "mock-member",
        status: "active",
        plan_type: "enterprise",
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

    getUser();
  }, []);

  const checkSubscription = async (currentUser: User) => {
    if (!currentUser) return;

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
        return;
      }

      // Query platform_subscriptions for the tenant
      const { data: subData } = await supabase
        .from("platform_subscriptions")
        .select("*")
        .eq("tenant_id", membershipData.tenant_id)
        .maybeSingle();

      if (subData) {
        const isActive = (subData.status === 'active' || subData.status === 'trialing');
        setIsPro(isActive && (subData.plan_tier === 'pro' || subData.plan_tier === 'enterprise'));
        setSubscription({
          id: subData.id,
          member_id: currentUser.id,
          status: subData.status,
          plan_type: subData.plan_tier,
          created_at: subData.created_at,
          expires_at: subData.current_period_end
        });
      } else {
        // Check if it's a demo/trial account or fallback to user metadata
        const { data: userData } = await supabase.auth.getUser();
        const userMeta = userData?.user?.user_metadata;
        const isDemoAccount = currentUser.email?.includes("demo") || 
                             currentUser.email?.includes("test") ||
                             currentUser.email?.includes("trial") ||
                             !!userMeta?.paid;
        
        if (isDemoAccount) {
          const plan = userMeta?.subscription_tier || "pro";
          setIsPro(plan === "pro" || plan === "enterprise");
          setSubscription({
            id: "metadata-subscription",
            member_id: currentUser.id,
            status: "active",
            plan_type: plan,
            created_at: new Date().toISOString(),
          });
        } else {
          setIsPro(false);
          setSubscription(null);
        }
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setIsPro(false);
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
    console.warn("useSubscription was called outside of a SubscriptionProvider. Returning default fallback context.");
    return {
      isPro: true,
      isLoading: false,
      subscription: {
        id: "fallback-subscription",
        member_id: "fallback-member",
        status: "active",
        plan_type: "enterprise",
        created_at: new Date().toISOString(),
      },
      proFeatures: {
        deepAnalytics: true,
        advancedReports: true,
        automationEngine: true,
        memberInsights: true,
        bulkOperations: true,
        customBranding: true,
        apiAccess: true,
      },
      checkProFeature: () => true,
      upgradePrompt: () => {},
    };
  }
  return context;
}
