import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { User, AuthError } from "@supabase/supabase-js";
import { api } from "../api/client";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase, getCurrentUser } from "../supabaseClient";
import { UserRole, isValidRole, getDefaultRole } from "../types/roles";

// Enhanced error types
interface AuthErrorState {
  code: string;
  message: string;
  details?: string;
}

// Enhanced user metadata type
interface UserMetadata {
  tenant_id: string;
  paid: boolean;
  role: UserRole;
  subscription_tier: "free" | "basic" | "premium" | "enterprise";
}

interface AuthContextType {
  user: User | null;
  tenantId: string | null;
  isLoading: boolean;
  error: AuthErrorState | null;
  userMetadata: UserMetadata | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_ERROR: AuthErrorState = {
  code: "unknown",
  message: "An unknown error occurred",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthErrorState | null>(null);
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Enhanced error handler
  const handleAuthError = useCallback((error: unknown) => {
    const authError = error as AuthError;
    const errorState: AuthErrorState = {
      code: authError.name || DEFAULT_ERROR.code,
      message: authError.message || DEFAULT_ERROR.message,
      details: authError.stack,
    };
    setError(errorState);
    // Only log auth errors in development or if they're critical
    if (import.meta.env.DEV || errorState.code !== "DEFAULT") {
      console.error("Auth error:", errorState);
    }
    return errorState;
  }, []);

  // Enhanced metadata handler
  const handleUserMetadata = useCallback((user: User | null) => {
    if (!user) {
      setUserMetadata(null);
      setTenantId(null);
      return;
    }

    // Validate and sanitize user role
    const rawRole = user.user_metadata?.role;
    const validatedRole: UserRole = isValidRole(rawRole)
      ? rawRole
      : getDefaultRole();

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
      const { user, error } = await getCurrentUser();
      if (error) throw error;

      setUser(user);
      handleUserMetadata(user);

      // Don't redirect from checkAuth for public routes - let the pages handle their own redirects
      // This allows pages to render first before redirecting
      const publicRoutes = ["/", "/login", "/signup", "/subscribe", "/onboarding"];
      if (publicRoutes.includes(location.pathname)) {
        setIsLoading(false);
        return;
      }

      // Subscription check with grace period (only for protected routes)
      if (user && !user.user_metadata?.paid) {
        const gracePeriod = new Date(user.user_metadata?.trial_end || 0);
        const now = new Date();
        if (now > gracePeriod) {
          navigate("/subscribe", { replace: true });
        }
      }
    } catch (err) {
      const errorState = handleAuthError(err);
      // Don't redirect if user is on a public route (signup, login, landing)
      const publicRoutes = ["/", "/login", "/signup", "/subscribe", "/onboarding"];
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      setUser(user);
      handleUserMetadata(user);
      setIsLoading(false);

      switch (event) {
        case "SIGNED_IN":
          // Only redirect if this is a NEW sign-in (not an existing session on page load)
          // We check this by seeing if the event was triggered by an actual sign-in action
          // vs. just detecting an existing session
          if (!user) break;
          
          // Don't redirect if user is on signup page - let the signup flow handle it
          if (location.pathname === "/signup") {
            break;
          }
          
          if (!user.user_metadata?.paid) {
            const gracePeriod = new Date(user.user_metadata?.trial_end || 0);
            const now = new Date();
            if (now > gracePeriod) {
              navigate("/subscribe");
              break;
            }
          }
          // Check if onboarding is completed
          if (user.user_metadata?.paid && !user.user_metadata?.onboarding_completed) {
            navigate("/onboarding");
            break;
          }
          // Only redirect to dashboard if on auth pages (but not on initial load)
          // The checkAuth function handles initial load redirects
          const authPages = ["/login"];
          if (authPages.includes(location.pathname)) {
            navigate("/dashboard");
          }
          break;

        case "SIGNED_OUT":
          navigate("/");
          break;

        case "USER_UPDATED":
          handleUserMetadata(user);
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
      const { error } = await api.auth.signOut();
      if (error) throw error;
      setUser(null);
      setUserMetadata(null);
      toast.success("Successfully signed out!");
      navigate("/"); // Go to landing page after logout
    } catch (err) {
      const errorState = handleAuthError(err);
      toast.error(errorState.message);
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
        manager: ["read", "write", "manage_staff"],
        trainer: ["read", "write_classes"],
        staff: ["read"],
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
