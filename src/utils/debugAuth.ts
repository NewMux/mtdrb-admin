/**
 * Debug Authentication Utilities
 * 
 * WARNING: These functions are for DEVELOPMENT USE ONLY.
 * They will not execute in production builds.
 */
import { supabase } from "../supabaseClient";

const isDevelopment = import.meta.env.DEV;

/**
 * Debug current authentication state
 * Only works in development mode
 */
export async function debugAuth() {
  if (!isDevelopment) {
    console.warn("debugAuth() is only available in development mode");
    return { user: null, membership: null, tenant: null };
  }

  try {
    // Check current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) console.error("[DEV] User error:", userError);

    if (!user) {
      return { user: null, membership: null, tenant: null };
    }

    // Check membership
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("*, tenant:tenants(*)")
      .eq("user_id", user.id)
      .single();

    if (membershipError) console.error("[DEV] Membership error:", membershipError);

    return { user, membership, tenant: membership?.tenant || null };
  } catch (error) {
    console.error("[DEV] Debug auth error:", error);
    return { user: null, membership: null, tenant: null };
  }
}

/**
 * Check database tables accessibility
 * Only works in development mode
 */
export async function checkDatabaseTables() {
  if (!isDevelopment) {
    console.warn("checkDatabaseTables() is only available in development mode");
    return { error: "Development only" };
  }

  try {
    // Check if classes table exists and is accessible
    const { error: classesError } = await supabase
      .from("classes")
      .select("count")
      .limit(1);

    // Check if trainers table exists and is accessible
    const { error: trainersError } = await supabase
      .from("trainers")
      .select("count")
      .limit(1);

    // Check if class_bookings table exists and is accessible
    let bookingsError = null;
    try {
      const result = await supabase
        .from("class_bookings")
        .select("count")
        .limit(1);
      bookingsError = result.error;
    } catch (err) {
      bookingsError = err;
    }

    return {
      classes: { exists: !classesError, error: classesError },
      trainers: { exists: !trainersError, error: trainersError },
      bookings: { exists: !bookingsError, error: bookingsError },
    };
  } catch (error) {
    console.error("[DEV] Database check error:", error);
    return { error };
  }
}

/**
 * Create test membership data for development
 * WARNING: Only works in development mode
 */
export async function createTestMembership(userId: string) {
  if (!isDevelopment) {
    console.warn("createTestMembership() is only available in development mode");
    throw new Error("Development only function");
  }

  try {
    // Create a test tenant if it doesn't exist
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .upsert({
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Test Gym",
        has_plans: true,
        has_trainers: true,
        has_classes: true,
      })
      .select()
      .single();

    if (tenantError) throw tenantError;

    // Create membership
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .upsert({
        user_id: userId,
        tenant_id: tenant.id,
        role: "admin",
      })
      .select()
      .single();

    if (membershipError) throw membershipError;

    // Check if trainers table exists before trying to create trainers
    const { error: trainersError } = await supabase
      .from("trainers")
      .select("count")
      .limit(1);

    if (!trainersError) {
      // Create test trainers
      const trainers = [
        {
          id: "770e8400-e29b-41d4-a716-446655440001",
          tenant_id: tenant.id,
          name: "Sarah Johnson",
          email: "sarah.johnson@testgym.com",
          phone: "+1234567890",
          status: "active",
          specialties: ["Yoga", "Pilates"],
        },
        {
          id: "770e8400-e29b-41d4-a716-446655440002",
          tenant_id: tenant.id,
          name: "Mike Chen",
          email: "mike.chen@testgym.com",
          phone: "+1234567891",
          status: "active",
          specialties: ["HIIT", "Cardio"],
        },
      ];

      for (const trainer of trainers) {
        await supabase.from("trainers").upsert(trainer).select().single();
      }

      // Create test classes
      const classes = [
        {
          id: "660e8400-e29b-41d4-a716-446655440001",
          tenant_id: tenant.id,
          name: "Morning Yoga",
          description: "Gentle morning yoga session for all levels",
          trainer_id: "770e8400-e29b-41d4-a716-446655440001",
          start_time: new Date(
            Date.now() + 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000,
          ).toISOString(),
          end_time: new Date(
            Date.now() + 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000,
          ).toISOString(),
          capacity: 20,
        },
        {
          id: "660e8400-e29b-41d4-a716-446655440002",
          tenant_id: tenant.id,
          name: "HIIT Training",
          description: "High-intensity interval training",
          trainer_id: "770e8400-e29b-41d4-a716-446655440002",
          start_time: new Date(
            Date.now() + 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000,
          ).toISOString(),
          end_time: new Date(
            Date.now() + 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000,
          ).toISOString(),
          capacity: 15,
        },
      ];

      for (const classItem of classes) {
        await supabase.from("classes").upsert(classItem).select().single();
      }
    }

    return membership;
  } catch (error) {
    console.error("[DEV] Error creating test membership:", error);
    throw error;
  }
}
