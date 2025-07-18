import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

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
      console.log('🔧 AuthSetup - Already running, skipping...');
      return;
    }
    hasRunRef.current = true;

    // TEMPORARY: Bypass setup for immediate dashboard access
    console.log('🔧 AuthSetup - TEMPORARY BYPASS: Showing dashboard immediately');
    setIsSetupComplete(true);
    setIsLoading(false);
    return;

    // Add a timeout to detect if setup is stuck
    const timeoutId = setTimeout(() => {
      console.error('🔧 AuthSetup - TIMEOUT: Setup took too long, forcing completion');
      setIsSetupComplete(true);
      setIsLoading(false);
    }, 10000); // 10 second timeout

    const runSetup = async () => {
      console.log('🔧 AuthSetup wrapper starting...');
      
      try {
        // First, check and fix user metadata
        const { data: { user } } = await supabase.auth.getUser();
        console.log('🔧 AuthSetup - User check:', user ? 'Found' : 'Not found');
        
        if (user) {
          const metadata = user.user_metadata;
          console.log('🔧 AuthSetup - User metadata:', metadata);
          
          if (!metadata.tenant_id && metadata.tenantId) {
            console.log('Incorrect tenantId key found. Migrating...');
            toast.loading('Updating your user profile...');
            
            const { error: updateError } = await supabase.auth.updateUser({
              data: {
                tenant_id: metadata.tenantId, // Copy to correct key
                tenantId: null // Delete incorrect key
              }
            });

            toast.dismiss();
            if (updateError) {
              throw new Error('Failed to update user profile. Please try logging in again.');
            } else {
              toast.success('Profile updated successfully! Reloading...');
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
        console.log('🔧 AuthSetup - Starting membership setup...');
        
        // Test Supabase connection first
        try {
          console.log('🔧 AuthSetup - Testing connection...');
          const connectionPromise = supabase.from('tenants').select('id').limit(1);
          console.log('🔧 AuthSetup - Connection promise created:', connectionPromise);
          
          const { error: pingError } = await connectionPromise;
          console.log('🔧 AuthSetup - Connection test result:', { pingError });
          if (pingError) {
            console.error('Failed to connect to Supabase:', pingError);
            throw new Error('Database connection failed. Please check your internet connection and try again.');
          }
          console.log('🔧 AuthSetup - Connection test passed');
        } catch (pingError) {
          console.error('Connection test failed:', pingError);
          throw new Error('Unable to connect to the server. Please check your internet connection.');
        }

        console.log('🔧 AuthSetup - Getting user...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('🔧 AuthSetup - Get user result:', { user, userError });
        
        if (userError) {
          console.error('Error getting user:', userError);
          throw new Error('Unable to verify your account. Please try logging in again.');
        }
        
        if (!user) {
          console.log('🔧 AuthSetup - No user found, setup complete');
          setIsSetupComplete(true);
          clearTimeout(timeoutId);
          return;
        }

        console.log('🔧 AuthSetup - User found:', user.id);

        // Check if user already has a membership
        console.log('🔧 AuthSetup - Checking for existing membership...');
        const { data: existingMembership, error: membershipError } = await supabase
          .from('memberships')
          .select('id, tenant_id, role')
          .eq('user_id', user.id)
          .single();

        console.log('🔧 AuthSetup - Membership check result:', { existingMembership, membershipError });

        if (membershipError && membershipError.code !== 'PGRST116') {
          console.error('Error checking membership:', membershipError);
          throw new Error('Unable to verify your membership. Please try again.');
        }

        if (existingMembership) {
          console.log('🔧 AuthSetup - Existing membership found:', existingMembership);
          console.log('🔧 AuthSetup - Setting isSetupComplete to true');
          setIsSetupComplete(true);
          clearTimeout(timeoutId);
          return;
        }

        console.log('🔧 AuthSetup - No existing membership found, creating new one...');

        // User doesn't have membership, create one
        // First, check if there's an existing tenant or create one
        console.log('🔧 AuthSetup - Checking for existing tenant...');
        let { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('id, name')
          .limit(1)
          .single();

        console.log('🔧 AuthSetup - Tenant check result:', { tenantData, tenantError });

        if (tenantError && tenantError.code !== 'PGRST116') {
          console.error('Error checking tenants:', tenantError);
          throw new Error('Unable to verify organization details. Please try again.');
        }

        if (!tenantData) {
          console.log('🔧 AuthSetup - No tenant exists, creating one...');
          const { data: newTenant, error: newTenantError } = await supabase
            .from('tenants')
            .insert({
              name: 'My Gym',
              has_plans: false,
              has_trainers: false,
              has_classes: false
            })
            .select('id, name')
            .single();

          if (newTenantError) {
            console.error('Error creating tenant:', newTenantError);
            throw new Error('Unable to create your organization. Please try again.');
          }

          console.log('🔧 AuthSetup - New tenant created:', newTenant);
          tenantData = newTenant;
        }

        // Create membership for the user
        console.log('🔧 AuthSetup - Creating membership for user...');
        const { data: newMembership, error: insertError } = await supabase
          .from('memberships')
          .insert({
            user_id: user.id,
            tenant_id: tenantData.id,
            role: 'admin'
          })
          .select('id, tenant_id, role')
          .single();

        console.log('🔧 AuthSetup - Membership creation result:', { newMembership, insertError });

        if (insertError) {
          console.error('Error creating membership:', insertError);
          // If membership creation fails, try to clean up the tenant
          if (tenantData) {
            await supabase
              .from('tenants')
              .delete()
              .eq('id', tenantData.id);
          }
          throw new Error('Unable to set up your account. Please try again.');
        }

        console.log('🔧 AuthSetup - New membership created:', newMembership);

        // Update user metadata with tenant ID
        console.log('🔧 AuthSetup - Updating user metadata...');
        const { error: updateError } = await supabase.auth.updateUser({
          data: { tenant_id: tenantData.id }
        });

        if (updateError) {
          console.error('Error updating user metadata:', updateError);
          throw new Error('Unable to complete account setup. Please try again.');
        }

        console.log('🔧 AuthSetup - Setup complete, setting isSetupComplete to true');
        setIsSetupComplete(true);
        clearTimeout(timeoutId);
      } catch (err) {
        console.error('🔧 AuthSetup - Setup error:', err);
        setError((err as Error).message || 'An unexpected error occurred. Please try again.');
        clearTimeout(timeoutId);
      } finally {
        console.log('🔧 AuthSetup - Setting isLoading to false');
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
          <h1 className="text-xl font-bold text-red-600 mb-4">Connection Error</h1>
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