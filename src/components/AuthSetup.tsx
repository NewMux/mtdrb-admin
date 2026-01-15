import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

interface AuthSetupProps {
  children: React.ReactNode;
}

const AuthSetup = ({ children }: AuthSetupProps) => {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasRunRef = useRef(false);

  useEffect(() => {
    // Prevent double execution
    if (hasRunRef.current) {
      return;
    }
    hasRunRef.current = true;

    // Add a timeout to detect if setup is stuck
    const timeoutId = setTimeout(() => {
      console.error(
        "🔧 AuthSetup - TIMEOUT: Setup took too long, forcing completion",
      );
      setIsSetupComplete(true);
      setIsLoading(false);
    }, 10000); // 10 second timeout

    const runSetup = async () => {
      try {
        // First, check and fix user metadata
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const metadata = user.user_metadata;

          if (!metadata.tenant_id && metadata.tenantId) {
            toast.loading("Updating your user profile...");

            const { error: updateError } = await supabase.auth.updateUser({
              data: {
                tenant_id: metadata.tenantId, // Copy to correct key
                tenantId: null, // Delete incorrect key
              },
            });

            toast.dismiss();
            if (updateError) {
              throw new Error(
                "Failed to update user profile. Please try logging in again.",
              );
            } else {
              toast.success("Profile updated successfully! Reloading...");
              setTimeout(() => window.location.reload(), 1500);
              return; // Stop execution to allow for reload
            }
          }
        }
      } catch (migrationError) {
        console.error("Metadata migration failed:", migrationError);
        setError((migrationError as Error).message);
        setIsLoading(false);
        clearTimeout(timeoutId);
        return;
      }

      // If no migration was needed, proceed with normal setup
      await setupUserMembership();
    };

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

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw new Error(
            "Unable to verify your account. Please try logging in again.",
          );
        }

        if (!user) {
          setIsSetupComplete(true);
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
          setIsSetupComplete(true);
          clearTimeout(timeoutId);
          return;
        }

        // User doesn&apos;t have membership, create one
        // First, check if there&apos;s an existing tenant or create one
        const { data: initialTenantData, error: tenantError } = await supabase
          .from("tenants")
          .select("id, name")
          .limit(1)
          .single();

        let tenantData = initialTenantData;
        if (tenantError && tenantError.code !== "PGRST116") {
          console.error("Error checking tenants:", tenantError);
          throw new Error(
            "Unable to verify organization details. Please try again.",
          );
        }

        if (!tenantData) {
          const { data: newTenant, error: newTenantError } = await supabase
            .from("tenants")
            .insert({
              name: "My Gym",
              has_plans: false,
              has_trainers: false,
              has_classes: false,
            })
            .select("id, name")
            .single();

          if (newTenantError) {
            throw new Error(
              "Unable to create your organization. Please try again.",
            );
          }

          tenantData = newTenant;
        }

        // Create membership for the user
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
          // If membership creation fails, try to clean up the tenant
          if (tenantData) {
            await supabase.from("tenants").delete().eq("id", tenantData.id);
          }
          throw new Error("Unable to set up your account. Please try again.");
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

        setIsSetupComplete(true);
        clearTimeout(timeoutId);
      } catch (err) {
        setError(
          (err as Error).message ||
            "An unexpected error occurred. Please try again.",
        );
        clearTimeout(timeoutId);
      } finally {
        setIsLoading(false);
      }
    };

    runSetup();

    // Cleanup function
    return () => {
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
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-white to-blue-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-red-600 mb-4">
            Connection Error
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return isSetupComplete ? children : null;
};

export default AuthSetup;
