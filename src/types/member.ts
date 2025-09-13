export interface Member {
  id?: string;
  member_number?: number;
  name: string | null;
  gender?: "Male" | "Female" | "Other";
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  national_id?: string | null;
  emergency_contact?: string | null;
  language?: "English" | "Arabic";
  membership_status?: "Active" | "Trial" | "Cancelled" | "Paused";
  membership_type?: string | null;
  membership_price?: number | string | null;
  start_date?: string | null;
  end_date?: string | null;
  plan_id?: string | null;
  assigned_trainer_id?: string | null;
  assigned_trainer?: {
    id: string;
    name: string;
  };
  add_ons?: any[];
  tags?: string[] | null;
  staff_notes?: string | null;
  medical_notes?: string | null;
  consent_signed?: boolean;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;

  // Legacy fields for backwards compatibility
  status?: "active" | "inactive" | "suspended" | "expired" | "trial";
  membership_end_date?: string;
  joined_at?: string;
  payment_status?: "Paid" | "Unpaid" | "Overdue";
  assigned_plan?: { id: string; name: string };
  assigned_branch?: { id: string; name: string };
  notes?: string;
  flags?: string[];
  join_date?: string;
  expiry_date?: string;
  full_name?: string;
  profile_picture_url?: string;
  memberships?: { tenant_id: string; status: string }[];
  assigned_plan_id?: string;
  assigned_branch_id?: string;

  // 🚀 SMART MEMBER FIELDS
  // Health & Fitness Profile
  height?: number | null;
  weight?: number | null;
  target_weight?: number | null;
  fitness_level?: "Beginner" | "Intermediate" | "Advanced";
  medical_conditions?: string[] | null;
  injuries?: string[] | null;
  previous_gym_experience?: boolean;

  // Goals & Preferences
  primary_goals?: string[] | null;
  goal_timeline?: "1_month" | "3_months" | "6_months" | "1_year";
  workout_frequency_goal?: number;
  preferred_workout_times?: string[] | null;

  // Staff Management - Membership Setup
  access_level?: "Basic" | "Premium" | "VIP";
  membership_duration?:
    | "1_month"
    | "3_months"
    | "6_months"
    | "1_year"
    | "2_years"
    | "lifetime";
  billing_cycle?: "Monthly" | "Quarterly" | "Semi-Annual" | "Annual";
  discount_percentage?: number;
  discount_amount?: number;
  auto_renewal?: boolean;
  payment_method_preference?: "Card" | "Bank Transfer" | "Cash";

  // Modern Gym SaaS Features
  access_hours?: "Standard" | "24/7" | "Premium Hours";
  facility_access?: string[];
  fitness_tracker_integration?: boolean;
  body_composition_tracking?: boolean;
  progress_photos_consent?: boolean;
  referral_code?: string;
  corporate_membership?: boolean;
  family_plan?: boolean;

  // Communication & Automation Features
  preferred_contact_method?: "email" | "sms" | "whatsapp" | "app";
  workout_reminders?: boolean;
  progress_tracking_consent?: boolean;
  marketing_consent?: boolean;
  auto_schedule_intro?: boolean;
  buddy_system_interest?: boolean;
  send_welcome_sequence?: boolean;
}

export interface MemberFormData
  extends Omit<Member, "id" | "tenant_id" | "created_at" | "updated_at"> {
  id?: string;
  tenant_id?: string;
}

export const MEMBERSHIP_TYPES = [
  "Monthly",
  "3 Months",
  "6 Months",
  "Yearly",
  "Lifetime",
  "Custom",
] as const;

export const PAYMENT_METHODS = [
  "cash",
  "card",
  "bank_transfer",
  "digital_wallet",
  "cheque",
] as const;

export const PAYMENT_STATUSES = ["Paid", "Pending", "Partially Paid"] as const;

export const FITNESS_GOALS = [
  "Weight Loss",
  "Muscle Gain",
  "General Fitness",
  "Strength Training",
  "Endurance",
  "Flexibility",
  "Athletic Performance",
] as const;

export const COMMON_TAGS = [
  "VIP",
  "Athlete",
  "Trial",
  "Student",
  "Senior",
  "Corporate",
  "Staff",
] as const;
