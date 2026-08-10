import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import { isLocalhost } from "../utils/isLocalhost";

interface AuthSetupProps {
  children: React.ReactNode;
}

const AuthSetup = ({ children }: AuthSetupProps) => {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const finishSetup = () => {
      if (cancelled) return;
      setIsSetupComplete(true);
      setIsLoading(false);
    };

    // Skip backend setup on localhost (frontend-only dev mode)
    if (isLocalhost()) {
      finishSetup();
      return;
    }

    const failSetup = (message: string) => {
      if (cancelled) return;
      setError(message);
      setIsLoading(false);
    };

    // Safety net if Supabase calls hang
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      console.error(
        "AuthSetup - TIMEOUT: Setup took too long, forcing completion",
      );
      finishSetup();
    }, 5000);

    const setupUserMembership = async () => {
      try {
        // Test Supabase connection first
        try {
          const connectionPromise = supabase
            .from("tenants")
            .select("id")
            .limit(1);

          const { error: pingError } = await connectionPromise;
          if (pingError) {
            throw new Error(
              "Database connection failed. Please check your internet connection and try again.",
            );
          }
        } catch (pingError) {
          console.error("Connection test failed:", pingError);
          throw new Error(
            "Unable to connect to the server. Please check your internet connection.",
          );
        }

        // First, check if there's an active session
        // Retry a few times if no session is found (session might be establishing after login)
        let sessionData = await supabase.auth.getSession();
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!sessionData.data?.session && retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
          sessionData = await supabase.auth.getSession();
          retryCount++;
        }
        
        // If no session after retries, complete setup successfully (user is not logged in)
        // This is expected for public routes or when user hasn't logged in yet
        if (!sessionData.data?.session) {
          finishSetup();
          clearTimeout(timeoutId);
          return;
        }
        
        // If there's a session, try to refresh it if it's close to expiring
        if (sessionData.data?.session && !sessionData.error) {
          const expiresAt = sessionData.data.session.expires_at;
          const now = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = expiresAt ? expiresAt - now : 0;
          
          // Refresh if session expires in less than 5 minutes
          if (timeUntilExpiry < 300) {
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.warn("Session refresh failed:", refreshError);
              // Continue anyway - the session might still be valid
            }
          }
        }

        // Now try to get the user
        let userResult = await supabase.auth.getUser();
        let user = userResult.data?.user;
        let userError = userResult.error;

        // If getUser failed, try to recover
        if (userError) {
          // Log the actual error for debugging
          console.error("getUser() error:", userError);
          
          // Provide more specific error messages based on error type
          const errorMessage = userError.message?.toLowerCase() || "";
          
          // If it's a token/session error and we have a session, try refreshing
          if ((errorMessage.includes("jwt") || errorMessage.includes("token") || errorMessage.includes("expired")) && sessionData.data?.session) {
            // Try refreshing the session
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (!refreshError) {
              // Retry getUser after refresh
              userResult = await supabase.auth.getUser();
              user = userResult.data?.user;
              userError = userResult.error;
            }
          }
          
          // If we still have an error after retry, throw appropriate error
          if (userError) {
            const retryErrorMessage = userError.message?.toLowerCase() || "";
            if (retryErrorMessage.includes("jwt") || retryErrorMessage.includes("token") || retryErrorMessage.includes("expired")) {
              throw new Error(
                "Your session has expired. Please log in again.",
              );
            } else if (retryErrorMessage.includes("network") || retryErrorMessage.includes("fetch")) {
              throw new Error(
                "Network error. Please check your internet connection and try again.",
              );
            } else {
              // Generic error with more context
              throw new Error(
                `Unable to verify your account: ${userError.message || "Please try logging in again."}`,
              );
            }
          }
        }

        if (!user) {
          finishSetup();
          clearTimeout(timeoutId);
          return;
        }

        // Check if user already has a membership
        const { data: existingMembership, error: membershipError } =
          await supabase
            .from("memberships")
            .select("id, tenant_id, role")
            .eq("user_id", user.id)
            .single();

        if (membershipError && membershipError.code !== "PGRST116") {
          console.error("Error checking membership:", membershipError);
          throw new Error(
            "Unable to verify your membership. Please try again.",
          );
        }

        if (existingMembership) {
          finishSetup();
          clearTimeout(timeoutId);
          return;
        }

        // User doesn't have membership, create one
        // First, check if they have a tenant_id in metadata and if that tenant exists
        const metaTenantId = user.user_metadata?.tenant_id || user.user_metadata?.tenantId;
        let tenantData = null;

        if (metaTenantId) {
          const { data: existingTenant, error: tenantError } = await supabase
            .from("tenants")
            .select("id, name")
            .eq("id", metaTenantId)
            .single();

          if (!tenantError && existingTenant) {
            tenantData = existingTenant;
          }
        }

        if (!tenantData) {
          // Create tenant and membership using RPC function (bypasses RLS)
          const gymName = user.user_metadata?.gym_name || "My Gym";
          const { data: newTenantId, error: newTenantError } = await supabase
            .rpc('create_tenant_with_membership', {
              p_tenant_name: gymName,
              p_user_role: 'admin',
              p_tenant_metadata: {
                has_plans: false,
                has_trainers: false,
                has_classes: false,
              }
            });

          if (newTenantError) {
            console.error("Error creating tenant:", newTenantError);
            throw new Error(
              "Unable to create your organization. Please try again.",
            );
          }

          if (!newTenantId) {
            throw new Error("Unable to create your organization.");
          }

          // Fetch the created tenant to get full data
          const { data: fetchedTenant, error: fetchError } = await supabase
            .from("tenants")
            .select("id, name")
            .eq("id", newTenantId)
            .single();

          if (fetchError || !fetchedTenant) {
            throw new Error("Unable to verify created organization.");
          }

          tenantData = fetchedTenant;
        } else {
          // Tenant exists but user doesn't have membership - create membership
          const { error: insertError } = await supabase
            .from("memberships")
            .insert({
              user_id: user.id,
              tenant_id: tenantData.id,
              role: "admin",
            })
            .select("id, tenant_id, role")
            .single();

          if (insertError) {
            console.error("Error creating membership:", insertError);
            throw new Error("Unable to set up your account. Please try again.");
          }
        }

        // Update user metadata with tenant ID AND role
        // This ensures PermissionGuard can check the user's role
        const { error: updateError } = await supabase.auth.updateUser({
          data: { 
            tenant_id: tenantData.id,
            role: "admin", // Set role in user_metadata so PermissionGuard works
          },
        });

        if (updateError) {
          throw new Error(
            "Unable to complete account setup. Please try again.",
          );
        }

        finishSetup();
        clearTimeout(timeoutId);
      } catch (err) {
        console.error("AuthSetup error:", err);
        failSetup(
          (err as Error).message ||
            "An unexpected error occurred. Please try again.",
        );
        clearTimeout(timeoutId);
      }
    };

    // Simplified: Run setup immediately
    // Check for session first, if no session, complete immediately
    const runSetup = async () => {
      try {
        // First check if there's a session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("AuthSetup: No session found, completing setup");
          finishSetup();
          clearTimeout(timeoutId);
          return;
        }

        // Check and fix user metadata if needed
        const {
          data: { user },
          error: getUserError,
        } = await supabase.auth.getUser();

        if (getUserError) {
          const errorMessage = getUserError.message?.toLowerCase() || "";
          if (errorMessage.includes("session missing") || errorMessage.includes("auth session")) {
            finishSetup();
            clearTimeout(timeoutId);
            return;
          }
          console.warn("AuthSetup: getUser() error, continuing:", getUserError);
        }

        if (user) {
          const metadata = user.user_metadata;

          // Fix tenant_id metadata if needed
          if (!metadata.tenant_id && metadata.tenantId) {
            toast.loading("Updating your user profile...");

            const { error: updateError } = await supabase.auth.updateUser({
              data: {
                tenant_id: metadata.tenantId,
                tenantId: null,
              },
            });

            toast.dismiss();
            if (updateError) {
              throw new Error(
                "Failed to update user profile. Please try logging in again.",
              );
            } else {
              toast.success("Profile updated successfully! Reloading...");
              setIsLoading(false);
              setTimeout(() => window.location.reload(), 1500);
              return;
            }
          }
        }

        // Proceed with membership setup
        await setupUserMembership();
      } catch (err) {
        console.error("AuthSetup runSetup error:", err);
        failSetup((err as Error).message || "An unexpected error occurred.");
        clearTimeout(timeoutId);
      }
    };

    runSetup();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isSessionError = error.toLowerCase().includes("session") || 
                          error.toLowerCase().includes("log in") ||
                          error.toLowerCase().includes("expired");
    
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-white to-blue-50">
        <div className="text-center max-w-md p-8 bg-white rounded-3xl shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-red-600 mb-4">
            {isSessionError ? "Authentication Error" : "Connection Error"}
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            {isSessionError ? (
              <button
                onClick={() => {
                  window.location.href = "/login";
                }}
                className="px-6 py-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition font-medium"
              >
                Go to Login
              </button>
            ) : (
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition font-medium"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return isSetupComplete ? children : null;
};

export default AuthSetup;
