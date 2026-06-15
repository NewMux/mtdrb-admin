import React, { useEffect, useState, useCallback } from "react";
import { User, AuthError } from "@supabase/supabase-js";
import { api } from "../api/client";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase, getCurrentUser } from "../supabaseClient";
import { isValidRole, getDefaultRole } from "../types/roles";
import { isLocalhost } from "../utils/isLocalhost";
import {
  AuthContext,
  type AuthErrorState,
  type UserMetadata,
} from "./auth-context";

/**
 * Create a mock user for localhost development
 */
const createMockUser = (): User => {
  return {
    id: "mock-user-localhost",
    aud: "authenticated",
    role: "authenticated",
    email: "dev@localhost.local",
    email_confirmed_at: new Date().toISOString(),
    phone: "",
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {
      tenant_id: "00000000-0000-0000-0000-000000000000",
      paid: true,
      role: "admin",
      subscription_tier: "enterprise",
      onboarding_completed: true,
      name: "Local Dev User",
    },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as User;
};

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

  const handleUserMetadata = useCallback((user: User | null) => {
    if (!user) {
      setUserMetadata(null);
      setTenantId(null);
      return;
    }

    const rawRole = user.user_metadata?.role;
    const validatedRole = isValidRole(rawRole) ? rawRole : getDefaultRole();

    const metadata: UserMetadata = {
      tenant_id: user.user_metadata?.tenant_id || user.user_metadata?.tenantId,
      paid: user.user_metadata?.paid || false,
      role: validatedRole,
      subscription_tier: user.user_metadata?.subscription_tier || "free",
    };

    setUserMetadata(metadata);
    setTenantId(metadata.tenant_id);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setError(null);

      if (isLocalhost()) {
        const mockUser = createMockUser();
        setUser(mockUser);
        handleUserMetadata(mockUser);

        const publicRoutes = [
          "/",
          "/login",
          "/signup",
          "/subscribe",
          "/onboarding",
        ];
        if (publicRoutes.includes(location.pathname)) {
          setIsLoading(false);
          return;
        }

        setIsLoading(false);
        return;
      }

      const { user, error } = await getCurrentUser();

      if (error) throw error;

      setUser(user);
      handleUserMetadata(user);

      const publicRoutes = [
        "/",
        "/login",
        "/signup",
        "/subscribe",
        "/onboarding",
      ];
      if (publicRoutes.includes(location.pathname)) {
        setIsLoading(false);
        return;
      }

      if (user && !user.user_metadata?.paid) {
        const gracePeriod = new Date(user.user_metadata?.trial_end || 0);
        const now = new Date();
        if (now > gracePeriod) {
          navigate("/subscribe", { replace: true });
        }
      }
    } catch (err) {
      const errorState = handleAuthError(err);
      const publicRoutes = [
        "/",
        "/login",
        "/signup",
        "/subscribe",
        "/onboarding",
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
      handleUserMetadata(sessionUser);
      setIsLoading(false);

      switch (event) {
        case "SIGNED_IN":
          if (!sessionUser) break;

          if (location.pathname === "/signup") {
            break;
          }

          if (!sessionUser.user_metadata?.paid) {
            const gracePeriod = new Date(
              sessionUser.user_metadata?.trial_end || 0,
            );
            const now = new Date();
            if (now > gracePeriod) {
              navigate("/subscribe");
              break;
            }
          }
          if (
            sessionUser.user_metadata?.paid &&
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
            handleUserMetadata(sessionUser);
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
