import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";

// ============================================================================
// TYPES
// ============================================================================

export interface AutomationTrigger {
  id: string;
  type: string;
  conditions: Record<string, unknown>;
}

export interface AutomationAction {
  id: string;
  type: string;
  parameters: Record<string, unknown>;
}

export interface AutomationStats {
  total_executions: number;
  success_rate: number;
  last_executed?: string;
}

export interface AutomationWorkflow {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  type: string;
  status: "active" | "paused" | "draft";
  icon?: string;
  color?: string;
  bg_color?: string;
  triggers?: AutomationTrigger[];
  actions?: AutomationAction[];
  settings?: Record<string, unknown>;
  stats?: AutomationStats;
  created_at: string;
  updated_at: string;
}

export interface AutomationSettings {
  id: string;
  tenant_id: string;
  workflow_type: string;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecentActivity {
  id: string;
  tenant_id: string;
  activity_type: string;
  activity_description: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface SmartInsight {
  id: string;
  tenant_id: string;
  insight_type:
    | "critical_alert"
    | "opportunity"
    | "trend"
    | "automation_suggestion";
  title: string;
  description?: string;
  action?: string;
  impact?: string;
  potential?: string;
  time_saved?: string;
  priority: number;
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ClassCategory {
  id: string;
  tenant_id: string;
  category_type: "popular" | "underbooked" | "waitlisted" | "high_rated";
  class_ids: string[];
  criteria?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ClassAnalytics {
  id: string;
  tenant_id: string;
  class_id?: string;
  analytics_type: string;
  analytics_data: Record<string, unknown>;
  period_start?: string;
  period_end?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Build workflow triggers from descriptive labels.
 */
const buildTriggers = (labels: string[]): AutomationTrigger[] => {
  return labels.map((label, index) => ({
    id: `trigger-${index + 1}-${label.toLowerCase().replace(/\s+/g, "-")}`,
    type: label,
    conditions: {},
  }));
};

// ============================================================================
// AUTOMATION WORKFLOWS
// ============================================================================

export const getAutomationWorkflows = async (
  tenantId: string,
): Promise<AutomationWorkflow[]> => {
  try {
    const { data, error } = await supabase
      .from("automation_workflows")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching automation workflows:", error);
    toast.error("Failed to load automation workflows");
    return [];
  }
};

export const createAutomationWorkflow = async (
  workflow: Omit<AutomationWorkflow, "id" | "created_at" | "updated_at">,
): Promise<AutomationWorkflow | null> => {
  try {
    const { data, error } = await supabase
      .from("automation_workflows")
      .insert(workflow)
      .select()
      .single();

    if (error) throw error;
    toast.success("Automation workflow created successfully");
    return data;
  } catch (error) {
    console.error("Error creating automation workflow:", error);
    toast.error("Failed to create automation workflow");
    return null;
  }
};

export const updateAutomationWorkflow = async (
  id: string,
  updates: Partial<AutomationWorkflow>,
): Promise<AutomationWorkflow | null> => {
  try {
    const { data, error } = await supabase
      .from("automation_workflows")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    toast.success("Automation workflow updated successfully");
    return data;
  } catch (error) {
    console.error("Error updating automation workflow:", error);
    toast.error("Failed to update automation workflow");
    return null;
  }
};

export const deleteAutomationWorkflow = async (
  id: string,
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("automation_workflows")
      .delete()
      .eq("id", id);

    if (error) throw error;
    toast.success("Automation workflow deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting automation workflow:", error);
    toast.error("Failed to delete automation workflow");
    return false;
  }
};

// ============================================================================
// AUTOMATION SETTINGS
// ============================================================================

export const getAutomationSettings = async (
  tenantId: string,
): Promise<AutomationSettings[]> => {
  try {
    const { data, error } = await supabase
      .from("automation_settings")
      .select("*")
      .eq("tenant_id", tenantId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching automation settings:", error);
    return [];
  }
};

export const getAutomationSetting = async (
  tenantId: string,
  workflowType: string,
): Promise<AutomationSettings | null> => {
  try {
    const { data, error } = await supabase
      .from("automation_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("workflow_type", workflowType)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows returned
    return data;
  } catch (error) {
    console.error("Error fetching automation setting:", error);
    return null;
  }
};

export const upsertAutomationSetting = async (
  setting: Omit<AutomationSettings, "id" | "created_at" | "updated_at">,
): Promise<AutomationSettings | null> => {
  try {
    const { data, error } = await supabase
      .from("automation_settings")
      .upsert(setting, { onConflict: "tenant_id,workflow_type" })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error upserting automation setting:", error);
    toast.error("Failed to save automation setting");
    return null;
  }
};

// ============================================================================
// RECENT ACTIVITIES
// ============================================================================

export const getRecentActivities = async (
  tenantId: string,
  limit: number = 10,
): Promise<RecentActivity[]> => {
  try {
    const { data, error } = await supabase
      .from("recent_activities")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return [];
  }
};

export const createRecentActivity = async (
  activity: Omit<RecentActivity, "id" | "created_at">,
): Promise<RecentActivity | null> => {
  try {
    const { data, error } = await supabase
      .from("recent_activities")
      .insert(activity)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating recent activity:", error);
    return null;
  }
};

// ============================================================================
// SMART INSIGHTS
// ============================================================================

export const getSmartInsights = async (
  tenantId: string,
): Promise<SmartInsight[]> => {
  if (!tenantId) return [];
  
  try {
    const { data, error } = await supabase
      .from("smart_insights")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    // Handle 404 (table doesn't exist) gracefully
    if (error && (error.code === 'PGRST116' || error.code === '42P01')) {
      return [];
    }
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    // Silently handle missing table errors
    if (import.meta.env.DEV) {
      console.warn("smart_insights table not found (optional feature):", error);
    }
    return [];
  }
};

export const createSmartInsight = async (
  insight: Omit<SmartInsight, "id" | "created_at" | "updated_at">,
): Promise<SmartInsight | null> => {
  try {
    const { data, error } = await supabase
      .from("smart_insights")
      .insert(insight)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating smart insight:", error);
    return null;
  }
};

export const updateSmartInsight = async (
  id: string,
  updates: Partial<SmartInsight>,
): Promise<SmartInsight | null> => {
  try {
    const { data, error } = await supabase
      .from("smart_insights")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating smart insight:", error);
    return null;
  }
};

// ============================================================================
// CLASS CATEGORIES
// ============================================================================

export const getClassCategories = async (
  tenantId: string,
): Promise<ClassCategory[]> => {
  if (!tenantId) return [];
  
  try {
    const { data, error } = await supabase
      .from("class_categories")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    // Handle 404 (table doesn't exist) gracefully
    if (error && (error.code === 'PGRST116' || error.code === '42P01')) {
      return [];
    }
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    // Silently handle missing table errors
    if (import.meta.env.DEV) {
      console.warn("class_categories table not found (optional feature):", error);
    }
    return [];
  }
};

export const upsertClassCategory = async (
  category: Omit<ClassCategory, "id" | "created_at" | "updated_at">,
): Promise<ClassCategory | null> => {
  try {
    const { data, error } = await supabase
      .from("class_categories")
      .upsert(category, { onConflict: "tenant_id,category_type" })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error upserting class category:", error);
    return null;
  }
};

// ============================================================================
// CLASS ANALYTICS
// ============================================================================

export const getClassAnalytics = async (
  tenantId: string,
  analyticsType?: string,
): Promise<ClassAnalytics[]> => {
  try {
    let query = supabase
      .from("class_analytics")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (analyticsType) {
      query = query.eq("analytics_type", analyticsType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching class analytics:", error);
    return [];
  }
};

export const upsertClassAnalytics = async (
  analytics: Omit<ClassAnalytics, "id" | "created_at" | "updated_at">,
): Promise<ClassAnalytics | null> => {
  try {
    const { data, error } = await supabase
      .from("class_analytics")
      .upsert(analytics, { onConflict: "tenant_id,analytics_type" })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error upserting class analytics:", error);
    return null;
  }
};

// ============================================================================
// DEFAULT WORKFLOWS (for initialization)
// ============================================================================

export const getDefaultWorkflows = (
  tenantId: string,
): Omit<AutomationWorkflow, "id" | "created_at" | "updated_at">[] => {
  return [
    {
      tenant_id: tenantId,
      name: "Smart Booking Reminders",
      description:
        "Automatically send personalized reminders 24h before class time with custom messages based on member preferences.",
      type: "booking_reminders",
      status: "active",
      icon: "FiBell",
      color: "text-blue-600",
      bg_color: "bg-blue-50",
      triggers: buildTriggers([
        "24 hours before class",
        "Member books class",
        "Class changes",
      ]),
      actions: [
        {
          id: "action-email",
          type: "send_email_notification",
          parameters: {},
        },
        {
          id: "action-push",
          type: "push_notification",
          parameters: {},
        },
        {
          id: "action-calendar",
          type: "add_to_calendar",
          parameters: {},
        },
      ],
      settings: {
        reminderTime: 24,
        channels: ["email"],
        personalizedMessages: true,
        weatherIntegration: true,
      },
      stats: {
        total_executions: 127,
        success_rate: 94,
        last_executed: "2 hours ago",
      },
    },
    {
      tenant_id: tenantId,
      name: "Class Capacity Optimizer",
      description:
        "Automatically adjust class capacity and create additional sessions when demand is high. Smart waitlist management.",
      type: "capacity_optimization",
      status: "active",
      icon: "FiTarget",
      color: "text-green-600",
      bg_color: "bg-green-50",
      triggers: buildTriggers([
        "24 hours before class",
        "Member books class",
        "Class changes",
      ]),
      actions: [
        {
          id: "action-1",
          type: "create_session",
          parameters: {},
        },
        {
          id: "action-2",
          type: "increase_capacity",
          parameters: {},
        },
        {
          id: "action-3",
          type: "notify_trainers",
          parameters: {},
        },
        {
          id: "action-4",
          type: "auto_book_waitlist",
          parameters: {},
        },
      ],
      settings: {
        capacityThreshold: 90,
        waitlistThreshold: 5,
        autoCreateSessions: true,
        trainerNotification: true,
      },
      stats: {
        total_executions: 23,
        success_rate: 21,
        last_executed: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
    },
    {
      tenant_id: tenantId,
      name: "Smart Class Scheduling",
      description:
        "Smart-powered scheduling that analyzes member preferences, trainer availability, and historical data to optimize class times.",
      type: "schedule_optimization",
      status: "active",
      icon: "FiCalendar",
      color: "text-purple-600",
      bg_color: "bg-purple-50",
      triggers: buildTriggers([
        "24 hours before class",
        "Member books class",
        "Class changes",
      ]),
      actions: [
        {
          id: "action-5",
          type: "suggest_optimal_times",
          parameters: {},
        },
        {
          id: "action-6",
          type: "auto_reschedule",
          parameters: {},
        },
        {
          id: "action-7",
          type: "send_schedule_updates",
          parameters: {},
        },
        {
          id: "action-8",
          type: "notify_affected_members",
          parameters: {},
        },
      ],
      settings: {
        aiOptimization: true,
        memberPreferences: true,
        trainerAvailability: true,
        historicalData: true,
      },
      stats: {
        total_executions: 8,
        success_rate: 7,
        last_executed: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    {
      tenant_id: tenantId,
      name: "Class Marketing Automation",
      description:
        "Promote underperforming classes with targeted campaigns. Special offers for members who haven't booked recently.",
      type: "marketing_automation",
      status: "active",
      icon: "FiTrendingUp",
      color: "text-orange-600",
      bg_color: "bg-orange-50",
      triggers: buildTriggers([
        "24 hours before class",
        "Member books class",
        "Class changes",
      ]),
      actions: [
        {
          id: "action-9",
          type: "send_promotional_email",
          parameters: {},
        },
        {
          id: "action-10",
          type: "create_discount_code",
          parameters: {},
        },
        {
          id: "action-11",
          type: "social_media_post",
          parameters: {},
        },
        {
          id: "action-12",
          type: "in_app_notification",
          parameters: {},
        },
      ],
      settings: {
        discountPercentage: 15,
        targetAudience: "inactive_members",
        campaignDuration: 7,
        maxPromotions: 3,
      },
      stats: {
        total_executions: 34,
        success_rate: 29,
        last_executed: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
    },
    {
      tenant_id: tenantId,
      name: "Attendance Tracking & Follow-up",
      description:
        "Track no-shows automatically and send follow-up messages. Manage cancellation policies and waitlist promotion.",
      type: "attendance_tracking",
      status: "active",
      icon: "FiUsers",
      color: "text-red-600",
      bg_color: "bg-red-50",
      triggers: [
        {
          id: "trigger-1",
          type: "no_show",
          conditions: {},
        },
        {
          id: "trigger-2",
          type: "cancellation",
          conditions: {},
        },
        {
          id: "trigger-3",
          type: "waitlist_full",
          conditions: {},
        },
      ],
      actions: [
        {
          id: "action-13",
          type: "send_follow_up",
          parameters: {},
        },
        {
          id: "action-14",
          type: "promote_waitlist",
          parameters: {},
        },
        {
          id: "action-15",
          type: "apply_penalty",
          parameters: {},
        },
        {
          id: "action-16",
          type: "track_attendance",
          parameters: {},
        },
      ],
      settings: {
        noShowPenalty: true,
        followUpDelay: 2,
        waitlistPromotion: true,
        attendanceRewards: false,
      },
      stats: {
        total_executions: 67,
        success_rate: 64,
        last_executed: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    },
  ];
};

// ============================================================================
// INITIALIZATION FUNCTIONS
// ============================================================================

export const initializeAutomationData = async (
  tenantId: string,
): Promise<boolean> => {
  try {
    // Check if workflows already exist
    const existingWorkflows = await getAutomationWorkflows(tenantId);
    if (existingWorkflows.length > 0) {
      return true;
    }

    // Create default workflows
    const defaultWorkflows = getDefaultWorkflows(tenantId);
    for (const workflow of defaultWorkflows) {
      await createAutomationWorkflow(workflow);
    }

    // Create default settings
    const defaultSettings = [
      {
        tenant_id: tenantId,
        workflow_type: "capacity_alerts",
        settings: { enabled: true, threshold: 90, notifications: ["email"] },
        is_active: true,
      },
      {
        tenant_id: tenantId,
        workflow_type: "booking_reminders",
        settings: { enabled: true, reminderTime: 24, channels: ["email"] },
        is_active: true,
      },
      {
        tenant_id: tenantId,
        workflow_type: "schedule_optimization",
        settings: {
          enabled: true,
          aiOptimization: true,
          memberPreferences: true,
        },
        is_active: true,
      },
    ];

    for (const setting of defaultSettings) {
      await upsertAutomationSetting(setting);
    }

    return true;
  } catch (error) {
    return false;
  }
};
