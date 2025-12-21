import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

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

      // Check if user has an active subscription
      // Note: subscriptions table uses member_id, so we need to find the member first
      const { data: memberData } = await supabase
        .from("members")
        .select("id")
        .eq("user_id", currentUser.id)
        .single();

      if (!memberData) {
        setIsPro(false);
        return;
      }

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("member_id", memberData.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setIsPro(true);
        setSubscription(data[0] as Subscription);
      } else {
        // Check if it's a demo/trial account with pro features
        const isDemoAccount = currentUser.email?.includes("demo") || 
                             currentUser.email?.includes("test") ||
                             currentUser.email?.includes("trial");
        
        if (isDemoAccount) {
          setIsPro(true);
          setSubscription({
            id: "demo-subscription",
            member_id: memberData.id,
            status: "active",
            plan_type: "demo",
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

  const checkProFeature = (feature: string): boolean => {
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
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
