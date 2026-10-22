/**
 * Types for the platform-owner (superadmin) console.
 *
 * These mirror the jsonb returned by the platform_* RPCs in
 * supabase/migrations/20261019090000_create_platform_admin_console.sql. They
 * are deliberately NOT part of UserRole: the platform owner is a separate
 * concept from a tenant membership role.
 */

/** Result of platform_admin_status(). Anything unexpected is treated as not_admin. */
export type PlatformAdminStatus = "not_admin" | "mfa_required" | "ok";

/** What access a tenant currently has, as derived by platform_access_state(). */
export type AccessState =
  | "awaiting_activation"
  | "paid"
  | "complimentary"
  | "trialing"
  /** A renewal payment failed; access continues until the grace period ends. */
  | "past_due"
  | "inactive";

export type PlanTier = "starter" | "pro" | "enterprise" | "demo";

export type TenantFilter = "all" | AccessState | "ending_soon" | "suspended";

export type TenantSort =
  | "created_desc"
  | "created_asc"
  | "name_asc"
  | "period_end_asc";

export interface SubscriptionSummary {
  status: string;
  plan_tier: PlanTier | string;
  payment_provider: string;
  trial_end: string | null;
  current_period_end: string | null;
  /** Detail view only. */
  payment_reference?: string | null;
  amount?: number | null;
  currency?: string | null;
}

export interface PlatformTenantRow {
  id: string;
  name: string;
  created_at: string;
  admin_email: string | null;
  admin_last_sign_in: string | null;
  access_state: AccessState;
  /** True while the gym is suspended (its staff cannot sign in). */
  suspended: boolean;
  subscription: SubscriptionSummary | null;
  members: number;
  trainers: number;
  branches: number;
  classes: number;
}

export interface PlatformTenantList {
  total: number;
  rows: PlatformTenantRow[];
}

export interface PlatformAuditEntry {
  id: number;
  created_at: string;
  actor_email: string | null;
  action: PlatformAuditAction;
  tenant_id: string | null;
  tenant_name: string | null;
  details: {
    reason?: string;
    note?: string;
    before?: Partial<SubscriptionSummary> | null;
    after?: Partial<SubscriptionSummary> | null;
    /** User actions: the account acted on. */
    email?: string;
    /** change_role */
    from?: string;
    to?: string;
    /** suspend_gym / unsuspend_gym */
    banned_users?: number;
    unbanned_users?: number;
    /** delete_user */
    reassigned_to?: string | null;
    reassigned?: Record<string, number>;
    /** delete_gym: counts and account emails only, never member records. */
    usage?: Record<string, number>;
    deleted_users?: string[];
    kept_users?: number;
    /** reset_mfa */
    factors_removed?: number;
    /** create_gym */
    admin_email?: string;
    plan_tier?: string;
    until?: string | null;
  };
}

export type PlatformAuditAction =
  | "grant_access"
  | "revoke_access"
  | "note"
  | "suspend_gym"
  | "unsuspend_gym"
  | "delete_gym"
  | "ban_user"
  | "unban_user"
  | "reset_mfa"
  | "change_role"
  | "delete_user"
  | "create_gym";

/** The only roles a gym membership can hold (memberships.role CHECK). */
export type GymRole = "admin" | "employee" | "trainer";

export interface PlatformStaffMember {
  user_id: string;
  email: string;
  role: GymRole | string;
  joined_at: string;
  last_sign_in_at: string | null;
  /** Signed-in access is blocked (banned or the gym is suspended). */
  banned: boolean;
  /** Platform admins can never be changed through the console. */
  is_platform_admin: boolean;
}

export interface PlatformAuditList {
  total: number;
  rows: PlatformAuditEntry[];
}

export interface AwaitingTenant {
  id: string;
  name: string;
  created_at: string;
  admin_email: string | null;
  admin_last_sign_in: string | null;
  members: number;
}

export interface EndingSoonTenant {
  id: string;
  name: string;
  plan_tier: string | null;
  access_state: AccessState;
  current_period_end: string;
}

export interface PlatformOverview {
  generated_at: string;
  totals: { tenants: number; new_7d: number; new_30d: number };
  by_state: Record<AccessState, number>;
  no_expiry_comps: number;
  awaiting_activation: AwaitingTenant[];
  ending_soon: EndingSoonTenant[];
  recent_changes: PlatformAuditEntry[];
}

export interface PlatformTenantDetail {
  tenant: { id: string; name: string; created_at: string };
  access_state: AccessState;
  /** Null unless the gym is suspended. */
  suspension: { suspended_at: string; reason: string } | null;
  subscription: SubscriptionSummary | null;
  staff: PlatformStaffMember[];
  usage: {
    members: number;
    active_members: number;
    trainers: number;
    branches: number;
    classes: number;
    last_activity_at: string | null;
  };
  audit: PlatformAuditEntry[];
}

export interface ListTenantsParams {
  search?: string;
  filter?: TenantFilter;
  sort?: TenantSort;
  limit?: number;
  offset?: number;
}

export interface GrantAccessParams {
  tenantId: string;
  planTier: PlanTier;
  /** ISO timestamp, or null for no expiry. */
  until: string | null;
  reason: string;
}

export interface InviteGymParams {
  gymName: string;
  adminEmail: string;
  planTier: PlanTier;
  /** ISO timestamp, or null for no expiry. */
  until: string | null;
  reason: string;
}

export interface InviteGymResult {
  tenantId: string;
  userId: string;
  email: string;
}
