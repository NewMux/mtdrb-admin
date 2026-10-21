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
  | "inactive";

export type PlanTier = "starter" | "pro" | "enterprise" | "demo";

export type TenantFilter = "all" | AccessState | "ending_soon";

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
  action: "grant_access" | "revoke_access" | "note";
  tenant_id: string | null;
  tenant_name: string | null;
  details: {
    reason?: string;
    note?: string;
    before?: Partial<SubscriptionSummary> | null;
    after?: Partial<SubscriptionSummary> | null;
  };
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
  subscription: SubscriptionSummary | null;
  staff: Array<{
    email: string;
    role: string;
    joined_at: string;
    last_sign_in_at: string | null;
  }>;
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
