// Re-export Member from member.ts to avoid conflicts
export type { Member, MemberFormData } from "./member";
export {
  MEMBERSHIP_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  FITNESS_GOALS,
  COMMON_TAGS,
} from "./member";

import { UserRole } from "./roles";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  metadata: {
    paid: boolean;
    tenantId: string;
  };
}

export interface Class {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  start_time: string;
  end_time: string;
  location: string;
  trainer: string;
  trainer_id?: string;
  capacity: number;
  price?: number;
  recurrence_rule?: string;
  color?: string;
  description?: string;
  attachment_url?: string;
  reminders?: string;
  created_at: string;
}

export type PaymentMethodType =
  | "cash"
  | "card"
  | "bank_transfer"
  | "cheque"
  | "digital_wallet";

export type InvoiceType = "Membership" | "PT" | "Class" | "Facility" | "Other";

export type InvoiceStatus =
  | "Paid"
  | "Unpaid"
  | "Partial"
  | "Overdue"
  | "Refunded"
  | "Draft"
  | "Cancelled";

export type ExpenseCategory =
  | "Salaries"
  | "Rent"
  | "Utilities"
  | "Equipment"
  | "Cleaning"
  | "Subscriptions"
  | "Marketing"
  | "Insurance"
  | "Maintenance"
  | "Software"
  | "Office Supplies"
  | "Other";

export type ExpenseStatus = "pending" | "paid" | "approved" | "rejected";

export type RecurringFrequency = "weekly" | "monthly" | "quarterly" | "yearly";

export type VatRate = 0 | 5 | 10 | 15;

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: VatRate;
  discount_percentage: number;
  total: number;
}

export interface Invoice {
  id?: string;
  invoice_number?: string;
  member_id?: string;
  tenant_id?: string;
  type?: InvoiceType;
  status?: InvoiceStatus;
  issue_date?: string;
  due_date?: string;
  line_items?: LineItem[];
  subtotal?: number;
  vat_total?: number;
  discount_total?: number;
  total?: number;
  payment_method?: PaymentMethodType;
  paid_amount?: number;
  currency?: string;
  notes?: string;
  attachments?: string[];
  created_at?: string;
  updated_at?: string;
  title?: string;
  amount?: number;
  member?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    vat_number?: string;
  };
  audit_trail?: {
    action: string;
    timestamp: string;
    user: string;
    details: string;
  }[];
}

export interface Expense {
  id: string;
  tenant_id: string;
  created_by: string;
  title: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  payment_method: PaymentMethodType;
  vendor?: string;
  description?: string;
  receipt_url?: string;
  status: ExpenseStatus;
  currency: string;
  recurring: boolean;
  recurring_frequency?: RecurringFrequency;
  internal_notes?: string;
  public_notes?: string;
  created_at: string;
  updated_at: string;
  country_code?: string;
  vat_amount?: number;
  updated_by?: string;
}

export interface VatTransaction {
  id: string;
  tenant_id: string;
  date: string;
  type: "Invoice" | "Expense";
  reference_id: string;
  reference_number: string;
  entity_name: string;
  vat_rate: VatRate;
  amount: number;
  vat_amount: number;
  status: "Paid" | "Unpaid";
  created_at: string;
  // GCC-specific fields
  country_code?: string;
  vat_return_id?: string;
  transaction_category?:
    | "standard"
    | "zero_rated"
    | "exempt"
    | "import"
    | "export";
  original_currency?: string;
  exchange_rate?: number;
  customer_vat_number?: string;
  supplier_vat_number?: string;
}

export interface FinancialInsight {
  id: string;
  date: string;
  type: "Income" | "Expense";
  category: string;
  amount: number;
  reference_id: string;
  reference_type: "Invoice" | "Expense";
  description: string;
  created_at: string;
}

export interface ClassBooking {
  id: string;
  class_id: string;
  member_id: string;
  status: "booked" | "cancelled" | "attended" | "no-show";
  created_at: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface ApiError {
  message: string;
  code: string;
  details?: string;
}

export interface Trainer {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "on_leave";
  specialties: string[];
  bio: string;
  profile_image_url: string;
  hourly_rate: number;
  rating: number;
  created_at: string;
  classes?: Class[];
  performance?: TrainerPerformance[];
}

export interface TrainerPerformance {
  id: string;
  trainer_id: string;
  month: string;
  total_classes: number;
  total_revenue: number;
  average_rating: number;
  attendance_rate: number;
  created_at: string;
}

export interface TrainerSchedule {
  id: string;
  trainer_id: string;
  start_time: string;
  end_time: string;
  status: "available" | "booked" | "unavailable";
  class_id?: string;
  created_at: string;
}

export interface TrainerAvailability {
  start_time: string;
  end_time: string;
  status: "available" | "unavailable";
  recurring?: boolean;
  recurring_pattern?: string;
}

export interface AnalyticsOverview {
  members: {
    total: number;
    active: number;
    newThisMonth: number;
    atRisk: number;
  };
  trainers: {
    total: number;
    active: number;
    topPerformers: number;
  };
  classes: {
    total: number;
    upcoming: number;
    utilization: number;
  };
  revenue: {
    total: number;
    growth: number;
    projected: number;
  };
}

export interface MemberMetrics {
  retention: number;
  churnRate: number;
  lifetimeValue: number;
  acquisitionCost: number;
  demographics: {
    ageGroups: Record<string, number>;
    genderDistribution: Record<string, number>;
    membershipTypes: Record<string, number>;
  };
  trends: {
    date: string;
    newMembers: number;
    activeMembers: number;
    churned: number;
  }[];
}

export interface TrainerMetrics {
  utilization: number;
  satisfaction: number;
  revenue: number;
  performance: {
    trainer_id: string;
    name: string;
    rating: number;
    revenue: number;
    classes: number;
  }[];
  trends: {
    date: string;
    utilization: number;
    revenue: number;
    satisfaction: number;
  }[];
}

export interface ClassMetrics {
  totalClasses: number;
  averageAttendance: number;
  popularTimes: Record<string, number>;
  popularTypes: Record<string, number>;
  trends: {
    date: string;
    classes: number;
    attendance: number;
    revenue: number;
  }[];
}

export interface FinancialMetrics {
  revenue: {
    total: number;
    recurring: number;
    oneTime: number;
  };
  expenses: {
    total: number;
    categories: Record<string, number>;
  };
  profitability: {
    gross: number;
    net: number;
    margin: number;
  };
  trends: {
    date: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
}

export interface AutomationWorkflow {
  id: string;
  tenant_id: string;
  name: string;
  type: "member" | "trainer" | "class" | "billing";
  trigger: {
    event: string;
    conditions: Record<string, unknown>;
  };
  actions: {
    type: string;
    params: Record<string, unknown>;
  }[];
  status: "active" | "paused" | "draft";
  created_at: string;
  last_run?: string;
  stats?: {
    runs: number;
    successes: number;
    failures: number;
  };
}

export interface AutomationSettings {
  id: string;
  tenant_id: string;
  enabled_workflows: string[];
  notification_preferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  schedule_preferences: {
    timezone: string;
    quiet_hours: {
      start: string;
      end: string;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  tenant_id: string;
  member_id: string;
  title: string;
  description: string;
  type: "follow_up" | "payment_reminder" | "renewal" | "check_in" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  due_date: string;
  assigned_to: string;
  tags?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

/** Business hours for a single day */
export interface DayBusinessHours {
  is_open: boolean;
  open_time?: string; // HH:mm format
  close_time?: string; // HH:mm format
}

/** Weekly business hours configuration */
export interface BusinessHours {
  sunday: DayBusinessHours;
  monday: DayBusinessHours;
  tuesday: DayBusinessHours;
  wednesday: DayBusinessHours;
  thursday: DayBusinessHours;
  friday: DayBusinessHours;
  saturday: DayBusinessHours;
}

/** Booking policies configuration */
export interface BookingPolicies {
  /** Minimum hours before class start to allow booking */
  min_booking_hours: number;
  /** Maximum days in advance to allow booking */
  max_advance_booking_days: number;
  /** Hours before class to allow cancellation without penalty */
  cancellation_hours: number;
  /** Enable waitlist when class is full */
  enable_waitlist: boolean;
  /** Maximum waitlist size (0 = unlimited) */
  max_waitlist_size: number;
  /** Automatically move waitlist to booking when spot opens */
  auto_promote_waitlist: boolean;
  /** Allow same-day bookings */
  allow_same_day_booking: boolean;
  /** Require payment at booking time */
  require_payment_on_booking: boolean;
  /** Maximum bookings per member per day */
  max_bookings_per_day: number;
  /** No-show penalty (e.g., restrict bookings for X days) */
  no_show_penalty_days: number;
}

export interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  is_active: boolean;
  business_hours?: BusinessHours;
  booking_policies?: BookingPolicies;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id?: string;
  user_id: string;
  tenant_id?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  preferences?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

// New VAT-related interfaces
export interface VatReturn {
  id: string;
  tenant_id: string;
  country_code: string;
  return_period_start: string;
  return_period_end: string;
  filing_period: "monthly" | "quarterly" | "annual";
  status: "draft" | "submitted" | "accepted" | "rejected";

  // VAT Summary
  total_sales: number;
  vat_on_sales: number;
  total_purchases: number;
  vat_on_purchases: number;
  net_vat_payable: number;

  // Additional fields for GCC compliance
  zero_rated_sales: number;
  exempt_sales: number;
  imports_subject_to_vat: number;

  // Filing information
  due_date: string;
  submitted_at?: string;
  submitted_by?: string;
  reference_number?: string;

  created_at: string;
  updated_at: string;
}

export interface VatReturnLineItem {
  id: string;
  vat_return_id: string;
  line_number: number;
  description: string;
  vat_rate: VatRate;
  net_amount: number;
  vat_amount: number;
  gross_amount: number;
  transaction_type: "sale" | "purchase" | "import" | "export";
  created_at: string;
}

export interface VatComplianceAudit {
  id: string;
  tenant_id: string;
  country_code: string;
  audit_date: string;
  compliance_score: number; // 0-100 score
  issues_found: number;
  critical_issues: number;
  recommendations: string[];
  status: "active" | "resolved" | "pending";
  created_at: string;
  updated_at: string;
}

export interface GccVatRate {
  id: string;
  country_code: string;
  country_name: string;
  vat_rate: number;
  currency_code: string;
  is_active: boolean;
  effective_from: string;
  effective_to?: string;
  created_at: string;
  updated_at: string;
}

export interface VatDashboardData {
  // Summary KPIs
  totalVatCollected: number;
  totalVatPaid: number;
  netVatPayable: number;
  complianceScore: number;

  // Period comparisons
  currentPeriodVat: number;
  previousPeriodVat: number;
  vatGrowthPercentage: number;

  // Compliance status
  overdueReturns: number;
  upcomingDeadlines: number;
  criticalIssues: number;

  // Country breakdown
  vatByCountry: {
    country_code: string;
    country_name: string;
    vat_collected: number;
    vat_paid: number;
    net_vat: number;
  }[];

  // Recent transactions
  recentTransactions: VatTransaction[];

  // Compliance alerts
  complianceAlerts: {
    type: "warning" | "error" | "info";
    message: string;
    action_required: boolean;
  }[];
}

export interface VatReportFilters {
  dateRange: [Date | null, Date | null];
  countryCode?: string;
  transactionType?: "Invoice" | "Expense";
  status?: string;
  vatRate?: VatRate;
  category?: string;
}

export interface VatReportData {
  summary: {
    totalTransactions: number;
    totalVatCollected: number;
    totalVatPaid: number;
    netVatPayable: number;
    averageVatRate: number;
  };
  transactions: VatTransaction[];
  breakdown: {
    byCountry: { country: string; amount: number; count: number }[];
    byType: { type: string; amount: number; count: number }[];
    byRate: { rate: number; amount: number; count: number }[];
    byMonth: { month: string; amount: number; count: number }[];
  };
  compliance: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
}
