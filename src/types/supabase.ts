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
          join_date: string;
          expiry_date?: string;
          trainer_id?: string;
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
          join_date: string;
          expiry_date?: string;
          trainer_id?: string;
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
          join_date?: string;
          expiry_date?: string;
          trainer_id?: string;
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
          amount: number;
          currency: string;
          status: "draft" | "pending" | "paid" | "overdue" | "cancelled";
          due_date: string;
          paid_date?: string;
          items: Json[];
          metadata?: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          tenant_id: string;
          member_id: string;
          amount: number;
          currency: string;
          status?: "draft" | "pending" | "paid" | "overdue" | "cancelled";
          due_date: string;
          paid_date?: string;
          items: Json[];
          metadata?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          tenant_id?: string;
          member_id?: string;
          amount?: number;
          currency?: string;
          status?: "draft" | "pending" | "paid" | "overdue" | "cancelled";
          due_date?: string;
          paid_date?: string;
          items?: Json[];
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
export type CompositeTypes<
  PublicCompositeTypeNameOrOptions = never,
  CompositeTypeName = never
> = never;

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
