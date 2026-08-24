import { supabase } from "../supabaseClient";
import type {
  Member,
  Class,
  Invoice,
  ClassBooking,
  ApiResponse,
  Branch,
  UserProfile,
  Trainer,
  TrainerPerformance,
  TrainerSchedule,
  TrainerAvailability,
  AnalyticsOverview,
  MemberMetrics,
  TrainerMetrics,
  ClassMetrics,
  FinancialMetrics,
  AutomationWorkflow,
  AutomationSettings,
  Task,
  Expense,
  VatReturn,
} from "../types";

/** Activity record type for tracking user/system actions */
interface Activity {
  id: string;
  tenant_id: string;
  type: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Removed mock data - using real data from Supabase
// Removed isDev - always use real Supabase

/** Raw `branches` row as it actually exists in the database. */
interface BranchRow {
  id: string;
  tenant_id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active: boolean;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

function fromBranchRow(row: BranchRow): Branch {
  const metadata = row.metadata || {};
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    name: row.name,
    address: row.address ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    is_active: row.is_active,
    manager_name: metadata.manager_name as string | undefined,
    business_hours: metadata.business_hours as Branch["business_hours"],
    booking_policies: metadata.booking_policies as Branch["booking_policies"],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toBranchRow(
  data: Partial<Branch>,
  existingMetadata: Record<string, unknown> = {},
): Record<string, unknown> {
  const { manager_name, business_hours, booking_policies, ...rest } = data;
  const row: Record<string, unknown> = { ...rest };
  if (manager_name !== undefined || business_hours !== undefined || booking_policies !== undefined) {
    row.metadata = {
      ...existingMetadata,
      ...(manager_name !== undefined && { manager_name }),
      ...(business_hours !== undefined && { business_hours }),
      ...(booking_policies !== undefined && { booking_policies }),
    };
  }
  return row;
}

export const api = {
  auth: {
    signUp: async (email: string, password: string, name: string) => {
      return supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
    },
    signIn: async (email: string, password: string) => {
      return supabase.auth.signInWithPassword({ email, password });
    },
    signOut: async () => {
      return supabase.auth.signOut();
    },
    getUser: async () => {
      return supabase.auth.getUser();
    },
    getSession: async () => {
      return supabase.auth.getSession();
    },
  },

  members: {
    getAll: async (): Promise<ApiResponse<Member[]>> => {
      return supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false });
    },
    getById: async (id: string): Promise<ApiResponse<Member>> => {
      return supabase.from("members").select("*").eq("id", id).single();
    },
    create: async (
      data: Omit<Member, "id" | "created_at">,
    ): Promise<ApiResponse<Member>> => {
      return supabase.from("members").insert(data).select().single();
    },
    update: async (
      id: string,
      data: Partial<Member>,
    ): Promise<ApiResponse<Member>> => {
      return supabase
        .from("members")
        .update(data)
        .eq("id", id)
        .select()
        .single();
    },
    delete: async (id: string): Promise<ApiResponse<null>> => {
      return supabase.from("members").delete().eq("id", id);
    },
    search: async (query: string): Promise<ApiResponse<Member[]>> => {
      return supabase
        .from("members")
        .select("*")
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .order("first_name", { ascending: true })
        .order("last_name", { ascending: true });
    },
  },

  classes: {
    getAll: async (): Promise<ApiResponse<Class[]>> => {
      return supabase
        .from("classes")
        .select("*")
        .order("start_time", { ascending: true });
    },
    getById: async (id: string): Promise<ApiResponse<Class>> => {
      return supabase.from("classes").select("*").eq("id", id).single();
    },
    create: async (
      data: Omit<Class, "id" | "created_at">,
    ): Promise<ApiResponse<Class>> => {
      return supabase.from("classes").insert(data).select().single();
    },
    update: async (
      id: string,
      data: Partial<Class>,
    ): Promise<ApiResponse<Class>> => {
      return supabase
        .from("classes")
        .update(data)
        .eq("id", id)
        .select()
        .single();
    },
    delete: async (id: string): Promise<ApiResponse<null>> => {
      return supabase.from("classes").delete().eq("id", id);
    },
    getByDateRange: async (
      start: string,
      end: string,
    ): Promise<ApiResponse<Class[]>> => {
      return supabase
        .from("classes")
        .select("*")
        .gte("start_time", start)
        .lte("end_time", end)
        .order("start_time", { ascending: true });
    },
  },

  invoices: {
    getAll: async (): Promise<ApiResponse<Invoice[]>> => {
      return supabase
        .from("invoices")
        .select("*")
        .order("date", { ascending: false });
    },
    getById: async (id: string): Promise<ApiResponse<Invoice>> => {
      return supabase.from("invoices").select("*").eq("id", id).single();
    },
    create: async (
      data: Omit<Invoice, "id" | "created_at">,
    ): Promise<ApiResponse<Invoice>> => {
      return supabase.from("invoices").insert(data).select().single();
    },
    update: async (
      id: string,
      data: Partial<Invoice>,
    ): Promise<ApiResponse<Invoice>> => {
      return supabase
        .from("invoices")
        .update(data)
        .eq("id", id)
        .select()
        .single();
    },
    delete: async (id: string): Promise<ApiResponse<null>> => {
      return supabase.from("invoices").delete().eq("id", id);
    },
  },

  bookings: {
    getAll: async (): Promise<ApiResponse<ClassBooking[]>> => {
      return supabase
        .from("class_bookings")
        .select("*")
        .order("created_at", { ascending: false });
    },
    getByClassId: async (
      classId: string,
    ): Promise<ApiResponse<ClassBooking[]>> => {
      return supabase
        .from("class_bookings")
        .select("*")
        .eq("class_id", classId)
        .order("created_at", { ascending: true });
    },
    create: async (
      data: Omit<ClassBooking, "id" | "created_at">,
    ): Promise<ApiResponse<ClassBooking>> => {
      return supabase.from("class_bookings").insert(data).select().single();
    },
    update: async (
      id: string,
      data: Partial<ClassBooking>,
    ): Promise<ApiResponse<ClassBooking>> => {
      return supabase
        .from("class_bookings")
        .update(data)
        .eq("id", id)
        .select()
        .single();
    },
    delete: async (id: string): Promise<ApiResponse<null>> => {
      return supabase.from("class_bookings").delete().eq("id", id);
    },
  },

  // Branch API functions
  fetchBranches: async (): Promise<Branch[]> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: membershipData, error: membershipError } = await supabase
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (membershipError) throw membershipError;
      const tenantId = membershipData?.tenant_id;
      if (!tenantId) throw new Error("No organization membership found");

      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching branches:", error);
      return [];
    }
  },

  // User Profile API functions
  fetchUserProfile: async (): Promise<UserProfile | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found"
        throw error;
      }

      return (
        data || {
          user_id: user.id,
          first_name: user.user_metadata?.name?.split(" ")[0] || "",
          last_name:
            user.user_metadata?.name?.split(" ").slice(1).join(" ") || "",
          phone: "",
          avatar_url: "",
          preferences: {},
        }
      );
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  },

  updateUserProfile: async (
    profile: Partial<UserProfile>,
  ): Promise<UserProfile | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          ...profile,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating user profile:", error);
      return null;
    }
  },

  // Switch branch function
  switchBranch: async (branchId: string): Promise<boolean> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: membershipData, error: membershipError } = await supabase
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (membershipError || !membershipData?.tenant_id) {
        throw membershipError || new Error("No organization membership found");
      }

      const { data: branch, error: branchError } = await supabase
        .from("branches")
        .select("id")
        .eq("id", branchId)
        .eq("tenant_id", membershipData.tenant_id)
        .maybeSingle();

      if (branchError) throw branchError;
      if (!branch) throw new Error("Branch does not belong to your organization");

      // Branch selection is a convenience preference only, never an
      // authorization source. Do not copy arbitrary metadata from the user.
      const { error } = await supabase.auth.updateUser({
        data: { selected_branch_id: branchId },
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error switching branch:", error);
      return false;
    }
  },

  trainers: {
    getAll: async (): Promise<ApiResponse<Trainer[]>> => {
      return supabase
        .from("trainers")
        .select(
          `
          *,
          classes (
            id,
            name,
            start_time,
            end_time,
            status
          ),
          trainer_performance (
            total_classes,
            total_revenue,
            average_rating,
            attendance_rate
          )
        `,
        )
        .order("created_at", { ascending: false });
    },
    getById: async (id: string): Promise<ApiResponse<Trainer>> => {
      return supabase
        .from("trainers")
        .select(
          `
          *,
          classes (
            id,
            name,
            start_time,
            end_time,
            status
          ),
          trainer_performance (
            total_classes,
            total_revenue,
            average_rating,
            attendance_rate
          )
        `,
        )
        .eq("id", id)
        .single();
    },
    create: async (
      data: Omit<Trainer, "id" | "created_at">,
    ): Promise<ApiResponse<Trainer>> => {
      return supabase.from("trainers").insert(data).select().single();
    },
    update: async (
      id: string,
      data: Partial<Trainer>,
    ): Promise<ApiResponse<Trainer>> => {
      return supabase
        .from("trainers")
        .update(data)
        .eq("id", id)
        .select()
        .single();
    },
    delete: async (id: string): Promise<ApiResponse<null>> => {
      return supabase.from("trainers").delete().eq("id", id);
    },
    getPerformance: async (
      id: string,
    ): Promise<ApiResponse<TrainerPerformance[]>> => {
      return supabase
        .from("trainer_performance")
        .select("*")
        .eq("trainer_id", id)
        .order("month", { ascending: false });
    },
    getSchedule: async (
      id: string,
      startDate: string,
      endDate: string,
    ): Promise<ApiResponse<TrainerSchedule[]>> => {
      return supabase
        .from("trainer_schedule")
        .select("*")
        .eq("trainer_id", id)
        .gte("start_time", startDate)
        .lte("end_time", endDate)
        .order("start_time", { ascending: true });
    },
    updateAvailability: async (
      id: string,
      availability: TrainerAvailability[],
    ): Promise<ApiResponse<null>> => {
      return supabase.from("trainer_schedule").upsert(
        availability.map((slot) => ({
          trainer_id: id,
          ...slot,
        })),
      );
    },
  },

  analytics: {
    getOverview: async (): Promise<ApiResponse<AnalyticsOverview>> => {
      return supabase.rpc("get_analytics_overview");
    },
    getMemberMetrics: async (
      period: string,
    ): Promise<ApiResponse<MemberMetrics>> => {
      return supabase.rpc("get_member_metrics", { p_period: period });
    },
    getTrainerMetrics: async (
      period: string,
    ): Promise<ApiResponse<TrainerMetrics>> => {
      return supabase.rpc("get_trainer_metrics", { p_period: period });
    },
    getClassMetrics: async (
      period: string,
    ): Promise<ApiResponse<ClassMetrics>> => {
      return supabase.rpc("get_class_metrics", { p_period: period });
    },
    getFinancialMetrics: async (
      period: string,
    ): Promise<ApiResponse<FinancialMetrics>> => {
      return supabase.rpc("get_financial_metrics", { p_period: period });
    },
  },

  automation: {
    getWorkflows: async (): Promise<ApiResponse<AutomationWorkflow[]>> => {
      return supabase
        .from("automation_workflows")
        .select("*")
        .order("created_at", { ascending: false });
    },
    createWorkflow: async (
      data: Omit<AutomationWorkflow, "id" | "created_at">,
    ): Promise<ApiResponse<AutomationWorkflow>> => {
      return supabase
        .from("automation_workflows")
        .insert(data)
        .select()
        .single();
    },
    updateWorkflow: async (
      id: string,
      data: Partial<AutomationWorkflow>,
    ): Promise<ApiResponse<AutomationWorkflow>> => {
      return supabase
        .from("automation_workflows")
        .update(data)
        .eq("id", id)
        .select()
        .single();
    },
    deleteWorkflow: async (id: string): Promise<ApiResponse<null>> => {
      return supabase.from("automation_workflows").delete().eq("id", id);
    },
    getSettings: async (): Promise<ApiResponse<AutomationSettings>> => {
      return supabase.from("automation_settings").select("*").single();
    },
    updateSettings: async (
      data: Partial<AutomationSettings>,
    ): Promise<ApiResponse<AutomationSettings>> => {
      return supabase
        .from("automation_settings")
        .upsert(data)
        .select()
        .single();
    },
  },

  tasks: {
    getAll: async (): Promise<ApiResponse<Task[]>> => {
      return supabase
        .from("member_tasks")
        .select("*")
        .order("due_date", { ascending: true });
    },
    create: async (
      data: Omit<Task, "id" | "created_at">,
    ): Promise<ApiResponse<Task>> => {
      return supabase.from("member_tasks").insert(data).select().single();
    },
    update: async (
      id: string,
      data: Partial<Task>,
    ): Promise<ApiResponse<Task>> => {
      return supabase
        .from("member_tasks")
        .update(data)
        .eq("id", id)
        .select()
        .single();
    },
    delete: async (id: string): Promise<ApiResponse<null>> => {
      return supabase.from("member_tasks").delete().eq("id", id);
    },
    getByMember: async (memberId: string): Promise<ApiResponse<Task[]>> => {
      return supabase
        .from("member_tasks")
        .select("*")
        .eq("member_id", memberId)
        .order("due_date", { ascending: true });
    },
    getByAssignee: async (assigneeId: string): Promise<ApiResponse<Task[]>> => {
      return supabase
        .from("member_tasks")
        .select("*")
        .eq("assigned_to", assigneeId)
        .order("due_date", { ascending: true });
    },
  },

  expenses: {
    getAll: async (): Promise<ApiResponse<Expense[]>> => {
      return supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });
    },
    getById: async (id: string): Promise<ApiResponse<Expense>> => {
      return supabase.from("expenses").select("*").eq("id", id).single();
    },
    create: async (data: Omit<Expense, "id" | "created_at">): Promise<ApiResponse<Expense>> => {
      return supabase.from("expenses").insert(data).select().single();
    },
    update: async (id: string, data: Partial<Expense>): Promise<ApiResponse<Expense>> => {
      return supabase
        .from("expenses")
        .update(data)
        .eq("id", id)
        .select()
        .single();
    },
    delete: async (id: string): Promise<ApiResponse<null>> => {
      return supabase.from("expenses").delete().eq("id", id);
    },
    getByDateRange: async (
      start: string,
      end: string,
    ): Promise<ApiResponse<Expense[]>> => {
      return supabase
        .from("expenses")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false });
    },
    getByCategory: async (category: string): Promise<ApiResponse<Expense[]>> => {
      return supabase
        .from("expenses")
        .select("*")
        .eq("category", category)
        .order("date", { ascending: false });
    },
  },

  activities: {
    getAll: async (): Promise<ApiResponse<Activity[]>> => {
      return supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false });
    },
    getRecent: async (limit: number = 20): Promise<ApiResponse<Activity[]>> => {
      return supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
    },
    create: async (data: Omit<Activity, "id" | "created_at">): Promise<ApiResponse<Activity>> => {
      return supabase.from("activities").insert(data).select().single();
    },
    getByType: async (type: string): Promise<ApiResponse<Activity[]>> => {
      return supabase
        .from("activities")
        .select("*")
        .eq("type", type)
        .order("created_at", { ascending: false });
    },
  },

  vatReturns: {
    getAll: async (): Promise<ApiResponse<VatReturn[]>> => {
      return supabase
        .from("vat_returns")
        .select("*")
        .order("period_start", { ascending: false });
    },
    getById: async (id: string): Promise<ApiResponse<VatReturn>> => {
      return supabase.from("vat_returns").select("*").eq("id", id).single();
    },
    create: async (data: Omit<VatReturn, "id" | "created_at">): Promise<ApiResponse<VatReturn>> => {
      return supabase.from("vat_returns").insert(data).select().single();
    },
    update: async (id: string, data: Partial<VatReturn>): Promise<ApiResponse<VatReturn>> => {
      return supabase
        .from("vat_returns")
        .update(data)
        .eq("id", id)
        .select()
        .single();
    },
    delete: async (id: string): Promise<ApiResponse<null>> => {
      return supabase.from("vat_returns").delete().eq("id", id);
    },
    getByPeriod: async (
      periodStart: string,
      periodEnd: string,
    ): Promise<ApiResponse<VatReturn[]>> => {
      return supabase
        .from("vat_returns")
        .select("*")
        .gte("period_start", periodStart)
        .lte("period_end", periodEnd)
        .order("period_start", { ascending: false });
    },
    submit: async (id: string): Promise<ApiResponse<VatReturn>> => {
      return supabase
        .from("vat_returns")
        .update({ status: "submitted", filed_date: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
    },
  },

  branches: {
    // `manager_name`/`business_hours`/`booking_policies` aren't real columns
    // on `branches` - they live under `metadata`. This boundary keeps the
    // rest of the app working with the flat `Branch` shape it already uses.
    getAll: async (): Promise<ApiResponse<Branch[]>> => {
      const result = await supabase
        .from("branches")
        .select("*")
        .order("name", { ascending: true });
      return { ...result, data: result.data?.map(fromBranchRow) ?? null };
    },
    getById: async (id: string): Promise<ApiResponse<Branch>> => {
      const result = await supabase.from("branches").select("*").eq("id", id).single();
      return { ...result, data: result.data ? fromBranchRow(result.data) : null };
    },
    create: async (data: Omit<Branch, "id" | "created_at">): Promise<ApiResponse<Branch>> => {
      const result = await supabase
        .from("branches")
        .insert(toBranchRow(data))
        .select()
        .single();
      return { ...result, data: result.data ? fromBranchRow(result.data) : null };
    },
    update: async (id: string, data: Partial<Branch>): Promise<ApiResponse<Branch>> => {
      const { data: existingRow } = await supabase
        .from("branches")
        .select("metadata")
        .eq("id", id)
        .single();
      const result = await supabase
        .from("branches")
        .update(toBranchRow(data, (existingRow?.metadata as Record<string, unknown>) || {}))
        .eq("id", id)
        .select()
        .single();
      return { ...result, data: result.data ? fromBranchRow(result.data) : null };
    },
    delete: async (id: string): Promise<ApiResponse<null>> => {
      return supabase.from("branches").delete().eq("id", id);
    },
    getActive: async (): Promise<ApiResponse<Branch[]>> => {
      const result = await supabase
        .from("branches")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      return { ...result, data: result.data?.map(fromBranchRow) ?? null };
    },
  },
};
