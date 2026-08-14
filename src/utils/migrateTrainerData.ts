import { supabase } from "../supabaseClient";

async function getTenantId(userId: string): Promise<string | null> {
  try {
    // First try to get from memberships table (most reliable)
    const { data: membership } = await supabase
      .from("memberships")
      .select("tenant_id")
      .eq("user_id", userId)
      .single();

    if (membership?.tenant_id) {
      return membership.tenant_id;
    }

    // Then try to get from tenants table where user is owner
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("owner_id", userId)
      .single();

    if (tenant?.id) {
      return tenant.id;
    }

    return null;
  } catch (error) {
    console.error("Error getting tenant ID:", error);
    return null;
  }
}

async function checkRequiredTables(): Promise<boolean> {
  try {
    const requiredTables = [
      "trainers",
      "trainer_performance",
      "trainer_schedule",
      "classes",
      "tenants",
      "memberships",
    ];

    const { data: tables, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .in("table_name", requiredTables);

    if (error) throw error;

    const existingTables = tables?.map((t) => t.table_name) || [];
    const missingTables = requiredTables.filter(
      (table) => !existingTables.includes(table),
    );

    if (missingTables.length > 0) {
      console.error("Missing required tables:", missingTables);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking required tables:", error);
    return false;
  }
}

async function migrateClassSchedules(
  tenant_id: string,
  trainer_id: string,
  trainer_name: string,
) {
  try {
    // Get all classes for this trainer
    const { data: classes, error: classError } = await supabase
      .from("classes")
      .select("*")
      .eq("tenant_id", tenant_id)
      .eq("trainer", trainer_name);

    if (classError) throw classError;
    if (!classes?.length) return;

    // Convert classes to trainer schedule entries
    const scheduleEntries = classes.map((cls) => ({
      trainer_id,
      tenant_id,
      title: cls.name || "Class Session",
      description: cls.description,
      start_time: cls.start_time,
      end_time:
        cls.end_time ||
        new Date(
          new Date(cls.start_time).getTime() + 60 * 60 * 1000,
        ).toISOString(),
      status: "scheduled",
      type: "class",
      max_participants: cls.max_participants,
      current_participants: cls.current_participants,
      location: cls.location,
    }));

    // Insert schedule entries
    const { error: insertError } = await supabase
      .from("trainer_schedule")
      .insert(scheduleEntries);

    if (insertError) throw insertError;
  } catch (error) {
    console.error("Error migrating class schedules:", error);
    throw error;
  }
}

export async function migrateTrainerData() {
  try {
    // Check if required tables exist
    const tablesExist = await checkRequiredTables();
    if (!tablesExist) {
      throw new Error(
        "Database schema not ready. Please wait for migrations to complete.",
      );
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("No authenticated user found");
    }

    // Get tenant ID
    const tenant_id = await getTenantId(user.id);
    if (!tenant_id) {
      throw new Error("No tenant ID found. Please contact support.");
    }

    // Get all classes with trainer names for this tenant
    const { data: classes, error: classError } = await supabase
      .from("classes")
      .select("trainer")
      .eq("tenant_id", tenant_id)
      .not("trainer", "is", null);

    if (classError) throw classError;

    // Get unique trainer names
    const trainerNames = [...new Set(classes?.map((c) => c.trainer) || [])];

    // Create trainer records
    for (const name of trainerNames) {
      if (!name) continue; // Skip empty names

      // Check if trainer already exists
      const { data: existing } = await supabase
        .from("trainers")
        .select("id")
        .eq("name", name)
        .eq("tenant_id", tenant_id)
        .single();

      if (existing) {
        // If trainer exists, just migrate their schedules
        await migrateClassSchedules(tenant_id, existing.id, name);
        continue;
      }

      // Create new trainer with required fields
      const { data: trainer, error: trainerError } = await supabase
        .from("trainers")
        .insert({
          tenant_id,
          name,
          status: "active",
          email: null,
          phone: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (trainerError) throw trainerError;

      // Migrate class schedules for the new trainer
      await migrateClassSchedules(tenant_id, trainer.id, name);

      // Initialize performance records
      const currentDate = new Date();
      const performanceRecords = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1,
        );
        return {
          trainer_id: trainer.id,
          tenant_id,
          month: date.toISOString().split("T")[0],
          total_classes: 0,
          total_revenue: 0,
          average_rating: 0,
          attendance_rate: 0,
          created_at: new Date().toISOString(),
        };
      });

      const { error: perfError } = await supabase
        .from("trainer_performance")
        .insert(performanceRecords);

      if (perfError) {
        console.error("Error initializing performance records:", perfError);
      }
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Error migrating trainer data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
