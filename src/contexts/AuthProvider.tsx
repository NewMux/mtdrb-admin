import React, { useEffect, useState, useCallback } from "react";
import { User, AuthError } from "@supabase/supabase-js";
import { api } from "../api/client";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase, getCurrentUser } from "../supabaseClient";
import { isValidRole } from "../types/roles";
import { isLocalhost } from "../utils/isLocalhost";
import { withTimeout } from "../utils/withTimeout";
import { isSubscriptionEntitled } from "../utils/subscriptionEntitlement";
import {
  AuthContext,
  type AuthErrorState,
  type UserMetadata,
} from "./auth-context";

const DEFAULT_ERROR: AuthErrorState = {
  code: "unknown",
  message: "An unknown error occurred",
};

/**
 * Provides authentication state and actions to the application.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthErrorState | null>(null);
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuthError = useCallback((error: unknown) => {
    const authError = error as AuthError;
    const errorState: AuthErrorState = {
      code: authError.name || DEFAULT_ERROR.code,
      message: authError.message || DEFAULT_ERROR.message,
      details: authError.stack,
    };
    setError(errorState);
    if (import.meta.env.DEV || errorState.code !== "DEFAULT") {
      console.error("Auth error:", errorState);
    }
    return errorState;
  }, []);

  const handleUserMetadata = useCallback(async (user: User | null) => {
    if (!user) {
      setUserMetadata(null);
      setTenantId(null);
      return null;
    }

    // Authorization state comes from the RLS-protected membership table. Auth
    // user_metadata is user-editable profile data and must never determine a
    // tenant or role.
    let membership: { tenant_id: string; role: string } | null = null;
    try {
      const { data: membershipData, error: membershipError } = await withTimeout(
        Promise.resolve(
          supabase
            .from("memberships")
            .select("tenant_id, role")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle(),
        ),
        8000,
        "Timed out checking organization membership",
      );

      if (membershipError) throw membershipError;
      membership = membershipData;
    } catch (err) {
      console.error("Error querying membership in handleUserMetadata:", err);
    }

    if (!membership?.tenant_id || !isValidRole(membership.role)) {
      setUserMetadata(null);
      setTenantId(null);
      return null;
    }

    const tId = membership.tenant_id;
    const validatedRole = membership.role;

    let isPaid = false;
    let tier: UserMetadata["subscription_tier"] = "free";

    if (tId) {
      try {
        const { data: subData } = await withTimeout(
          Promise.resolve(
            supabase
              .from("platform_subscriptions")
              .select("status, plan_tier, trial_end, current_period_end")
              .eq("tenant_id", tId)
              .maybeSingle(),
          ),
          8000,
          "Timed out checking subscription status",
        );

        if (subData) {
          isPaid = isSubscriptionEntitled(subData);
          tier = subData.plan_tier as UserMetadata["subscription_tier"];
        }
      } catch (err) {
        console.error("Error querying platform_subscriptions in handleUserMetadata:", err);
      }
    }

    const metadata: UserMetadata = {
      tenant_id: tId,
      paid: isPaid,
      role: validatedRole,
      subscription_tier: tier,
    };

    setUserMetadata(metadata);
    setTenantId(metadata.tenant_id);

    // Compatibility mirror for older UI filters. This is local React state,
    // not a persistence or authorization source; the values above came from
    // the membership/subscription tables and all writes remain RLS-protected.
    setUser((currentUser) => {
      if (!currentUser || currentUser.id !== user.id) return currentUser;
      return {
        ...currentUser,
        user_metadata: {
          ...currentUser.user_metadata,
          tenant_id: tId,
          role: validatedRole,
          paid: isPaid,
          subscription_tier: tier,
        },
      };
    });

    return metadata;
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setError(null);

      if (isLocalhost()) {
        let loggedIn = typeof window !== "undefined" ? sessionStorage.getItem("mock_logged_in") : null;
        
        if (loggedIn === null && typeof window !== "undefined") {
          const publicRoutes = ["/", "/login", "/signup", "/reset-password", "/forgot-password"];
          if (publicRoutes.includes(location.pathname)) {
            loggedIn = "false";
          } else {
            sessionStorage.setItem("mock_logged_in", "true");
            loggedIn = "true";
          }
        }
        
        if (loggedIn === "true") {
          const { data: { user: mockUser } } = await supabase.auth.getUser();
          if (mockUser) {
            setUser(mockUser);
            await handleUserMetadata(mockUser);
          } else {
            setUser(null);
            setUserMetadata(null);
            setTenantId(null);
          }
        } else {
          setUser(null);
          setUserMetadata(null);
          setTenantId(null);
        }

        const publicRoutes = [
          "/",
          "/login",
          "/signup",
          "/subscribe",
          "/onboarding",
          "/reset-password",
          "/forgot-password",
        ];
        if (publicRoutes.includes(location.pathname)) {
          setIsLoading(false);
          return;
        }

        if (loggedIn !== "true") {
          navigate("/login", { replace: true });
          setIsLoading(false);
          return;
        }

        setIsLoading(false);
        return;
      }

      const { user, error } = await withTimeout(
        getCurrentUser(),
        8000,
        "Timed out checking your session"
      );

      if (error) throw error;

      setUser(user);
      const metadata = await handleUserMetadata(user);

      const publicRoutes = [
        "/",
        "/login",
        "/signup",
        "/subscribe",
        "/onboarding",
        "/reset-password",
        "/forgot-password",
      ];
      if (publicRoutes.includes(location.pathname)) {
        setIsLoading(false);
        return;
      }

      // metadata.paid already reflects isSubscriptionEntitled() computed from
      // the RLS-protected platform_subscriptions row in handleUserMetadata.
      // Do not re-derive entitlement here from user_metadata.trial_end: it is
      // client-editable via supabase.auth.updateUser() and would let any user
      // grant themselves indefinite access by setting a future trial_end.
      if (metadata && !metadata.paid) {
        navigate("/subscribe", { replace: true });
      }
    } catch (err) {
      const errorState = handleAuthError(err);
      const publicRoutes = [
        "/",
        "/login",
        "/signup",
        "/subscribe",
        "/onboarding",
        "/reset-password",
        "/forgot-password",
      ];
      if (!publicRoutes.includes(location.pathname)) {
        navigate("/login", {
          replace: true,
          state: {
            error: errorState.message,
            return_to: location.pathname,
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate, location.pathname, handleAuthError, handleUserMetadata]);

  useEffect(() => {
    checkAuth();

    if (isLocalhost()) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const sessionUser = session?.user ?? null;

      setUser(sessionUser);
      const metadata = await handleUserMetadata(sessionUser);
      setIsLoading(false);

      switch (event) {
        case "SIGNED_IN":
          if (!sessionUser) break;

          if (
            location.pathname === "/signup" ||
            location.pathname === "/reset-password" ||
            location.pathname === "/forgot-password"
          ) {
            break;
          }

          // See the comment in checkAuth: entitlement must come only from
          // metadata.paid (derived server-side), never from user_metadata.
          if (metadata && !metadata.paid) {
            navigate("/subscribe");
            break;
          }
          if (
            metadata?.paid &&
            !sessionUser.user_metadata?.onboarding_completed
          ) {
            navigate("/onboarding");
            break;
          }
          if (location.pathname === "/login") {
            navigate("/dashboard");
          }
          break;

        case "SIGNED_OUT":
          navigate("/");
          break;

        case "USER_UPDATED":
          if (sessionUser) {
            await handleUserMetadata(sessionUser);
          }
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAuth, navigate, location.pathname, handleUserMetadata]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);
        if (isLocalhost()) {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("mock_logged_in", "true");
          }
        }
        const { error } = await api.auth.signIn(email, password);
        if (error) throw error;
        toast.success("Successfully signed in!");
      } catch (err) {
        const errorState = handleAuthError(err);
        toast.error(errorState.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthError],
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        setIsLoading(true);
        setError(null);
        if (isLocalhost()) {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("mock_logged_in", "true");
          }
        }
        const { error } = await api.auth.signUp(email, password, name);
        if (error) throw error;
        toast.success(
          "Successfully signed up! Please check your email for verification.",
        );
      } catch (err) {
        const errorState = handleAuthError(err);
        toast.error(errorState.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthError],
  );

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (isLocalhost()) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("mock_logged_in", "false");
        }
        setUser(null);
        setUserMetadata(null);
        setTenantId(null);
        toast.success("Successfully signed out!");
        navigate("/", { replace: true });
        setIsLoading(false);
        return;
      }

      const { error } = await api.auth.signOut();
      if (error) throw error;
      setUser(null);
      setUserMetadata(null);
      setTenantId(null);
      toast.success("Successfully signed out!");
      navigate("/", { replace: true });
    } catch (err) {
      const errorState = handleAuthError(err);
      toast.error(errorState.message);
      setUser(null);
      setUserMetadata(null);
      setTenantId(null);
      navigate("/", { replace: true });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthError, navigate]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!userMetadata) return false;

      const rolePermissions = {
        admin: ["all"],
        employee: ["read", "write", "manage_staff"],
        trainer: ["read", "write_classes"],
      };

      return (
        rolePermissions[userMetadata.role]?.includes(permission) ||
        rolePermissions[userMetadata.role]?.includes("all") ||
        false
      );
    },
    [userMetadata],
  );

  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (session) {
        setUser(session.user);
        handleUserMetadata(session.user);
      }
    } catch (err) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthError, handleUserMetadata]);

  const value = {
    user,
    tenantId,
    isLoading,
    error,
    userMetadata,
    signIn,
    signUp,
    signOut,
    checkAuth,
    hasPermission,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
