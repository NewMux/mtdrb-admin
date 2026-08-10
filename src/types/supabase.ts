export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
          has_plans: boolean;
          has_trainers: boolean;
          has_classes: boolean;
          metadata?: Json;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
          has_plans?: boolean;
          has_trainers?: boolean;
          has_classes?: boolean;
          metadata?: Json;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
          has_plans?: boolean;
          has_trainers?: boolean;
          has_classes?: boolean;
          metadata?: Json;
        };
      };
      memberships: {
        Row: {
          id: string;
          user_id: string;
          tenant_id: string;
          role: "admin" | "employee" | "trainer";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tenant_id: string;
          role?: "admin" | "employee" | "trainer";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tenant_id?: string;
          role?: "admin" | "employee" | "trainer";
          created_at?: string;
          updated_at?: string;
        };
      };
      gym_settings: {
        Row: {
          id: string;
          tenant_id: string;
          currency: string;
          vat_rate: number;
          vat_enabled: boolean;
          created_at: string;
          updated_at: string;
          metadata?: Json;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          currency?: string;
          vat_rate?: number;
          vat_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          currency?: string;
          vat_rate?: number;
          vat_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
          metadata?: Json;
        };
      };
      branches: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          address?: string;
          phone?: string;
          email?: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          metadata?: Json;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          address?: string;
          phone?: string;
          email?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          address?: string;
          phone?: string;
          email?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          metadata?: Json;
        };
      };
      expenses: {
        Row: {
          id: string;
          created_at: string;
          tenant_id: string;
          description: string;
          amount: number;
          vat_amount: number;
          category?: string;
          date: string;
          status: "pending" | "approved" | "rejected" | "cancelled";
          payment_method?: string;
          vendor?: string;
          receipt_url?: string;
          metadata?: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          tenant_id: string;
          description: string;
          amount: number;
          vat_amount?: number;
          category?: string;
          date: string;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          payment_method?: string;
          vendor?: string;
          receipt_url?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          tenant_id?: string;
          description?: string;
          amount?: number;
          vat_amount?: number;
          category?: string;
          date?: string;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          payment_method?: string;
          vendor?: string;
          receipt_url?: string;
          metadata?: Json;
        };
      };
      vat_returns: {
        Row: {
          id: string;
          created_at: string;
          tenant_id: string;
          period: string;
          period_start: string;
          period_end: string;
          status: "draft" | "submitted" | "approved" | "rejected";
          vat_collected: number;
          vat_paid: number;
          net_vat_payable: number;
          due_date?: string;
          filing_deadline?: string;
          filed_date?: string;
          metadata?: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          tenant_id: string;
          period: string;
          period_start: string;
          period_end: string;
          status?: "draft" | "submitted" | "approved" | "rejected";
          vat_collected?: number;
          vat_paid?: number;
          net_vat_payable?: number;
          due_date?: string;
          filing_deadline?: string;
          filed_date?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          tenant_id?: string;
          period?: string;
          period_start?: string;
          period_end?: string;
          status?: "draft" | "submitted" | "approved" | "rejected";
          vat_collected?: number;
          vat_paid?: number;
          net_vat_payable?: number;
          due_date?: string;
          filing_deadline?: string;
          filed_date?: string;
          metadata?: Json;
        };
      };
      member_tasks: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          tenant_id: string;
          member_id: string;
          title: string;
          description?: string;
          type: "follow_up" | "payment_reminder" | "renewal" | "check_in" | "other";
          priority: "low" | "medium" | "high" | "urgent";
          status: "pending" | "in_progress" | "completed" | "cancelled";
          due_date?: string;
          assigned_to?: string;
          created_by: string;
          completed_at?: string;
          metadata?: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          tenant_id: string;
          member_id: string;
          title: string;
          description?: string;
          type?: "follow_up" | "payment_reminder" | "renewal" | "check_in" | "other";
          priority?: "low" | "medium" | "high" | "urgent";
          status?: "pending" | "in_progress" | "completed" | "cancelled";
          due_date?: string;
          assigned_to?: string;
          created_by: string;
          completed_at?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          tenant_id?: string;
          member_id?: string;
          title?: string;
          description?: string;
          type?: "follow_up" | "payment_reminder" | "renewal" | "check_in" | "other";
          priority?: "low" | "medium" | "high" | "urgent";
          status?: "pending" | "in_progress" | "completed" | "cancelled";
          due_date?: string;
          assigned_to?: string;
          created_by?: string;
          completed_at?: string;
          metadata?: Json;
        };
      };
      activities: {
        Row: {
          id: string;
          created_at: string;
          tenant_id: string;
          type:
            | "member"
            | "payment"
            | "class"
            | "signup"
            | "renewal"
            | "booking";
          title: string;
          description: string;
          user?: string;
          amount?: string;
          status?: "success" | "pending" | "failed";
          metadata?: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          tenant_id: string;
          type:
            | "member"
            | "payment"
            | "class"
            | "signup"
            | "renewal"
            | "booking";
          title: string;
          description: string;
          user?: string;
          amount?: string;
          status?: "success" | "pending" | "failed";
          metadata?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          tenant_id?: string;
          type?:
            | "member"
            | "payment"
            | "class"
            | "signup"
            | "renewal"
            | "booking";
          title?: string;
          description?: string;
          user?: string;
          amount?: string;
          status?: "success" | "pending" | "failed";
          metadata?: Json;
        };
      };
      members: {
        Row: {
          id: string;
          created_at: string;
          tenant_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string;
          status: "active" | "inactive" | "pending" | "suspended";
          membership_type: string;
          membership_status?: "active" | "inactive" | "trial" | "expired" | "suspended";
          join_date: string;
          expiry_date?: string;
          trainer_id?: string;
          assigned_branch_id?: string;
          metadata?: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          tenant_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string;
          status?: "active" | "inactive" | "pending" | "suspended";
          membership_type: string;
          membership_status?: "active" | "inactive" | "trial" | "expired" | "suspended";
          join_date: string;
          expiry_date?: string;
          trainer_id?: string;
          assigned_branch_id?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          tenant_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          status?: "active" | "inactive" | "pending" | "suspended";
          membership_type?: string;
          membership_status?: "active" | "inactive" | "trial" | "expired" | "suspended";
          join_date?: string;
          expiry_date?: string;
          trainer_id?: string;
          assigned_branch_id?: string;
          metadata?: Json;
        };
      };
      trainers: {
        Row: {
          id: string;
          created_at: string;
          tenant_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string;
          status: "active" | "inactive" | "on_leave";
          specialties: string[];
          rating?: number;
          hourly_rate: number;
          metadata?: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          tenant_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string;
          status?: "active" | "inactive" | "on_leave";
          specialties: string[];
          rating?: number;
          hourly_rate: number;
          metadata?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          tenant_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          status?: "active" | "inactive" | "on_leave";
          specialties?: string[];
          rating?: number;
          hourly_rate?: number;
          metadata?: Json;
        };
      };
      classes: {
        Row: {
          id: string;
          created_at: string;
          tenant_id: string;
          name: string;
          description?: string;
          trainer_id: string;
          start_time: string;
          end_time: string;
          capacity: number;
          current_bookings: number;
          status: "scheduled" | "in_progress" | "completed" | "cancelled";
          room?: string;
          price?: number;
          metadata?: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          tenant_id: string;
          name: string;
          description?: string;
          trainer_id: string;
          start_time: string;
          end_time: string;
          capacity: number;
          current_bookings?: number;
          status?: "scheduled" | "in_progress" | "completed" | "cancelled";
          room?: string;
          price?: number;
          metadata?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          tenant_id?: string;
          name?: string;
          description?: string;
          trainer_id?: string;
          start_time?: string;
          end_time?: string;
          capacity?: number;
          current_bookings?: number;
          status?: "scheduled" | "in_progress" | "completed" | "cancelled";
          room?: string;
          price?: number;
          metadata?: Json;
        };
      };
      class_bookings: {
        Row: {
          id: string;
          created_at: string;
          tenant_id: string;
          class_id: string;
          member_id: string;
          status:
            | "booked"
            | "checked_in"
            | "completed"
            | "cancelled"
            | "no_show";
          check_in_time?: string;
          check_out_time?: string;
          metadata?: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          tenant_id: string;
          class_id: string;
          member_id: string;
          status?:
            | "booked"
            | "checked_in"
            | "completed"
            | "cancelled"
            | "no_show";
          check_in_time?: string;
          check_out_time?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          tenant_id?: string;
          class_id?: string;
          member_id?: string;
          status?:
            | "booked"
            | "checked_in"
            | "completed"
            | "cancelled"
            | "no_show";
          check_in_time?: string;
          check_out_time?: string;
          metadata?: Json;
        };
      };
      invoices: {
        Row: {
          id: string;
          created_at: string;
          tenant_id: string;
          member_id: string;
          type?: "membership" | "class" | "personal_training" | "product" | "other";
          amount: number;
          total?: number;
          paid_amount?: number;
          vat_total?: number;
          currency: string;
          status: "draft" | "pending" | "paid" | "overdue" | "cancelled";
          issue_date?: string;
          due_date: string;
          paid_date?: string;
          payment_method?: "cash" | "card" | "bank_transfer" | "online" | "other";
          items: Json[];
          line_items?: Json[];
          metadata?: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          tenant_id: string;
          member_id: string;
          type?: "membership" | "class" | "personal_training" | "product" | "other";
          amount: number;
          total?: number;
          paid_amount?: number;
          vat_total?: number;
          currency?: string;
          status?: "draft" | "pending" | "paid" | "overdue" | "cancelled";
          issue_date?: string;
          due_date: string;
          paid_date?: string;
          payment_method?: "cash" | "card" | "bank_transfer" | "online" | "other";
          items: Json[];
          line_items?: Json[];
          metadata?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          tenant_id?: string;
          member_id?: string;
          type?: "membership" | "class" | "personal_training" | "product" | "other";
          amount?: number;
          total?: number;
          paid_amount?: number;
          vat_total?: number;
          currency?: string;
          status?: "draft" | "pending" | "paid" | "overdue" | "cancelled";
          issue_date?: string;
          due_date?: string;
          paid_date?: string;
          payment_method?: "cash" | "card" | "bank_transfer" | "online" | "other";
          items?: Json[];
          line_items?: Json[];
          metadata?: Json;
        };
      };
      health_check: {
        Row: {
          id: string;
          created_at: string;
          status: "healthy" | "unhealthy";
          message?: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          status: "healthy" | "unhealthy";
          message?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          status?: "healthy" | "unhealthy";
          message?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_member_metrics: {
        Args: { tenant_id: string };
        Returns: Json;
      };
      get_trainer_metrics: {
        Args: { tenant_id: string };
        Returns: Json;
      };
      get_class_metrics: {
        Args: { tenant_id: string };
        Returns: Json;
      };
      get_financial_metrics: {
        Args: { tenant_id: string };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

// CompositeTypes not available in current schema
export type CompositeTypes = never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      billing_cycle: ["Weekly", "Monthly", "Annually"],
      expense_category: [
        "Salaries",
        "Rent",
        "Utilities",
        "Equipment",
        "Cleaning",
        "Subscriptions",
        "Marketing",
        "Insurance",
        "Maintenance",
        "Software",
        "Office Supplies",
        "Other",
      ],
      expense_status: ["pending", "paid", "approved", "rejected"],
      invoice_status_enum: ["Unpaid", "Paid", "Overdue", "Cancelled", "Draft"],
      payment_method_enum: [
        "Cash",
        "Card",
        "Bank Transfer",
        "Cheque",
        "Digital Wallet",
      ],
      recurring_frequency_enum: ["weekly", "monthly", "quarterly", "yearly"],
      subscription_plan_type: ["Membership", "PT", "Class Pack", "Online"],
      subscription_status: [
        "Active",
        "Paused",
        "Cancelled",
        "Expired",
        "Draft",
      ],
    },
  },
} as const;
