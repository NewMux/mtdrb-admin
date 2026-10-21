/**
 * Dev-only stand-in for the platform_* RPCs, used by the mock Supabase client
 * (credential-free `npm run dev`). It is an in-memory model so the console is
 * fully clickable: grants, revokes and notes change what the lists show.
 *
 * Production builds never include this file (IS_MOCK_MODE is a build-time
 * constant); scripts/check-dist-no-mock.mjs enforces that.
 */

interface MockSubscription {
  status: string;
  plan_tier: string;
  payment_provider: string;
  payment_reference: string | null;
  amount: number;
  currency: string;
  trial_end: string | null;
  current_period_end: string | null;
}

interface MockTenant {
  id: string;
  name: string;
  created_at: string;
  admin_email: string;
  admin_last_sign_in: string | null;
  sub: MockSubscription | null;
  members: number;
  trainers: number;
  branches: number;
  classes: number;
  last_activity_at: string | null;
}

interface MockAudit {
  id: number;
  created_at: string;
  actor_email: string;
  action: string;
  tenant_id: string;
  tenant_name: string;
  details: Record<string, unknown>;
}

type MockResult = { data: unknown; error: { message: string; code?: string } | null };

const DAY = 86_400_000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();
const ahead = (days: number) => new Date(Date.now() + days * DAY).toISOString();

const paddleSub = (tier: string, amount: number, periodDays: number): MockSubscription => ({
  status: "active",
  plan_tier: tier,
  payment_provider: "paddle",
  payment_reference: `sub_01demo${tier}${amount}`,
  amount,
  currency: "USD",
  trial_end: null,
  current_period_end: ahead(periodDays),
});

const tenants: MockTenant[] = [
  {
    id: "demo-t-1", name: "Iron Temple Fitness", created_at: ago(1), admin_email: "sara@irontemple.example",
    admin_last_sign_in: ago(0), sub: null, members: 12, trainers: 2, branches: 1, classes: 4, last_activity_at: ago(0),
  },
  {
    id: "demo-t-2", name: "Desert Rose Studio", created_at: ago(3), admin_email: "layla@desertrose.example",
    admin_last_sign_in: ago(1), sub: null, members: 0, trainers: 0, branches: 1, classes: 0, last_activity_at: null,
  },
  {
    id: "demo-t-3", name: "My Gym", created_at: ago(9), admin_email: "test123@mailinator.example",
    admin_last_sign_in: null, sub: null, members: 0, trainers: 0, branches: 0, classes: 0, last_activity_at: null,
  },
  {
    id: "demo-t-4", name: "Pulse Athletics", created_at: ago(40), admin_email: "omar@pulse.example",
    admin_last_sign_in: ago(0), sub: paddleSub("pro", 130, 18), members: 248, trainers: 9, branches: 3, classes: 52, last_activity_at: ago(0),
  },
  {
    id: "demo-t-5", name: "Oasis Wellness Club", created_at: ago(65), admin_email: "noor@oasis.example",
    admin_last_sign_in: ago(2), sub: paddleSub("starter", 80, 6), members: 91, trainers: 4, branches: 1, classes: 18, last_activity_at: ago(1),
  },
  {
    id: "demo-t-6", name: "Founders Box (comp)", created_at: ago(30), admin_email: "founder@box.example",
    admin_last_sign_in: ago(4), members: 33, trainers: 3, branches: 1, classes: 11, last_activity_at: ago(3),
    sub: {
      status: "active", plan_tier: "pro", payment_provider: "manual", payment_reference: null, amount: 0,
      currency: "AED", trial_end: null, current_period_end: ahead(6),
    },
  },
  {
    id: "demo-t-7", name: "Harbor CrossFit", created_at: ago(120), admin_email: "sam@harbor.example",
    admin_last_sign_in: ago(30), members: 60, trainers: 5, branches: 1, classes: 20, last_activity_at: ago(28),
    sub: { ...paddleSub("pro", 130, -20), status: "cancelled" },
  },
];

const audit: MockAudit[] = [];
let auditId = 1;

// Gym/user controls state (suspensions, bans, roles, deletions).
interface MockUserFlags {
  banned?: boolean;
  role?: string;
  mfa?: boolean;
}
const suspensions = new Map<string, { suspended_at: string; reason: string }>();
const userFlags = new Map<string, MockUserFlags>();
const deletedUsers = new Set<string>();

function staffOf(t: MockTenant) {
  const domain = t.admin_email.split("@")[1];
  const base = [
    { user_id: `${t.id}:u1`, email: t.admin_email, role: "admin", joined_at: t.created_at, last_sign_in_at: t.admin_last_sign_in },
    { user_id: `${t.id}:u2`, email: `frontdesk@${domain}`, role: "employee", joined_at: t.created_at, last_sign_in_at: ago(2) },
  ];
  const suspended = suspensions.has(t.id);
  return base
    .filter((u) => !deletedUsers.has(u.user_id))
    .map((u) => {
      const flags = userFlags.get(u.user_id) ?? {};
      return { ...u, role: flags.role ?? u.role, banned: suspended || !!flags.banned, is_platform_admin: false };
    });
}

function findUser(userId: unknown) {
  for (const t of tenants) {
    const u = staffOf(t).find((x) => x.user_id === userId);
    if (u) return { tenant: t, user: u };
  }
  return null;
}

function logAudit(action: string, t: MockTenant | null, details: Record<string, unknown>) {
  audit.push({
    id: auditId++, created_at: new Date().toISOString(), actor_email: "owner@mtdrb.example",
    action, tenant_id: t?.id ?? "", tenant_name: t?.name ?? "", details,
  });
}

function badReason(args: Record<string, unknown>): MockResult | null {
  const reason = String(args.p_reason ?? "").trim();
  return reason.length < 3 || reason.length > 500 ? fail("A reason of 3 to 500 characters is required") : null;
}

function accessState(sub: MockSubscription | null): string {
  if (!sub) return "awaiting_activation";
  const now = Date.now();
  const periodOpen = !sub.current_period_end || Date.parse(sub.current_period_end) > now;
  if (sub.status === "active" && periodOpen) {
    return sub.payment_provider === "manual" ? "complimentary" : "paid";
  }
  if (sub.status === "trialing" && sub.trial_end && Date.parse(sub.trial_end) > now) return "trialing";
  return "inactive";
}

function summary(sub: MockSubscription | null, detail = false) {
  if (!sub) return null;
  const base = {
    status: sub.status,
    plan_tier: sub.plan_tier,
    payment_provider: sub.payment_provider,
    trial_end: sub.trial_end,
    current_period_end: sub.current_period_end,
  };
  return detail
    ? { ...base, payment_reference: sub.payment_reference, amount: sub.amount, currency: sub.currency }
    : base;
}

function snapshot(sub: MockSubscription | null) {
  return sub ? summary(sub) : null;
}

function endingSoon(t: MockTenant): boolean {
  const state = accessState(t.sub);
  const end = t.sub?.current_period_end;
  return (
    (state === "paid" || state === "complimentary") &&
    !!end &&
    Date.parse(end) <= Date.now() + 14 * DAY
  );
}

function rowOf(t: MockTenant) {
  return {
    id: t.id,
    name: t.name,
    created_at: t.created_at,
    admin_email: t.admin_email,
    admin_last_sign_in: t.admin_last_sign_in,
    access_state: accessState(t.sub),
    suspended: suspensions.has(t.id),
    subscription: summary(t.sub),
    members: t.members,
    trainers: t.trainers,
    branches: t.branches,
    classes: t.classes,
  };
}

function auditRows(tenantId: string | null) {
  return audit
    .filter((a) => !tenantId || a.tenant_id === tenantId)
    .sort((a, b) => b.id - a.id);
}

function fail(message: string, code = "22023"): MockResult {
  return { data: null, error: { message, code } };
}

export function mockPlatformRpc(name: string, args: Record<string, unknown> = {}): MockResult | null {
  if (!name.startsWith("platform_")) return null;

  switch (name) {
    case "platform_admin_status":
      return { data: "ok", error: null };

    case "platform_overview": {
      const states = ["awaiting_activation", "paid", "complimentary", "trialing", "inactive"];
      const byState = Object.fromEntries(
        states.map((s) => [s, tenants.filter((t) => accessState(t.sub) === s).length]),
      );
      return {
        error: null,
        data: {
          generated_at: new Date().toISOString(),
          totals: {
            tenants: tenants.length,
            new_7d: tenants.filter((t) => Date.parse(t.created_at) >= Date.now() - 7 * DAY).length,
            new_30d: tenants.filter((t) => Date.parse(t.created_at) >= Date.now() - 30 * DAY).length,
          },
          by_state: byState,
          no_expiry_comps: tenants.filter(
            (t) => accessState(t.sub) === "complimentary" && !t.sub?.current_period_end,
          ).length,
          awaiting_activation: tenants
            .filter((t) => accessState(t.sub) === "awaiting_activation")
            .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
            .slice(0, 10)
            .map((t) => ({
              id: t.id, name: t.name, created_at: t.created_at, admin_email: t.admin_email,
              admin_last_sign_in: t.admin_last_sign_in, members: t.members,
            })),
          ending_soon: tenants
            .filter(endingSoon)
            .sort((a, b) => Date.parse(a.sub!.current_period_end!) - Date.parse(b.sub!.current_period_end!))
            .map((t) => ({
              id: t.id, name: t.name, plan_tier: t.sub!.plan_tier, access_state: accessState(t.sub),
              current_period_end: t.sub!.current_period_end,
            })),
          recent_changes: auditRows(null).slice(0, 10),
        },
      };
    }

    case "platform_list_tenants": {
      const search = String(args.p_search ?? "").trim().toLowerCase();
      const filter = String(args.p_filter ?? "all");
      const sort = String(args.p_sort ?? "created_desc");
      const limit = Math.min(Math.max(Number(args.p_limit ?? 25), 1), 100);
      const offset = Math.max(Number(args.p_offset ?? 0), 0);

      let rows = tenants.filter(
        (t) =>
          (!search || t.name.toLowerCase().includes(search) || t.admin_email.toLowerCase().includes(search)) &&
          (filter === "all" ||
            (filter === "suspended"
              ? suspensions.has(t.id)
              : filter === "ending_soon"
                ? endingSoon(t)
                : accessState(t.sub) === filter)),
      );
      const byCreated = (a: MockTenant, b: MockTenant) => Date.parse(a.created_at) - Date.parse(b.created_at);
      rows = [...rows].sort((a, b) => {
        if (sort === "created_asc") return byCreated(a, b);
        if (sort === "name_asc") return a.name.localeCompare(b.name);
        if (sort === "period_end_asc") {
          const ea = a.sub?.current_period_end ? Date.parse(a.sub.current_period_end) : Infinity;
          const eb = b.sub?.current_period_end ? Date.parse(b.sub.current_period_end) : Infinity;
          return ea - eb;
        }
        return byCreated(b, a);
      });
      return { error: null, data: { total: rows.length, rows: rows.slice(offset, offset + limit).map(rowOf) } };
    }

    case "platform_tenant_detail": {
      const t = tenants.find((x) => x.id === args.p_tenant_id);
      if (!t) return fail("Tenant not found", "P0002");
      return {
        error: null,
        data: {
          tenant: { id: t.id, name: t.name, created_at: t.created_at },
          access_state: accessState(t.sub),
          suspension: suspensions.get(t.id) ?? null,
          subscription: summary(t.sub, true),
          staff: staffOf(t),
          usage: {
            members: t.members,
            active_members: Math.round(t.members * 0.85),
            trainers: t.trainers,
            branches: t.branches,
            classes: t.classes,
            last_activity_at: t.last_activity_at,
          },
          audit: auditRows(t.id).slice(0, 20),
        },
      };
    }

    case "platform_list_audit_log": {
      const rows = auditRows((args.p_tenant_id as string | null) ?? null);
      const limit = Math.min(Math.max(Number(args.p_limit ?? 50), 1), 100);
      const offset = Math.max(Number(args.p_offset ?? 0), 0);
      return { error: null, data: { total: rows.length, rows: rows.slice(offset, offset + limit) } };
    }

    case "platform_grant_access": {
      const t = tenants.find((x) => x.id === args.p_tenant_id);
      if (!t) return fail("Tenant not found", "P0002");
      const reason = String(args.p_reason ?? "").trim();
      if (reason.length < 3 || reason.length > 500) return fail("A reason of 3 to 500 characters is required");
      if (accessState(t.sub) === "paid" && t.sub?.payment_provider === "paddle") {
        return fail(
          "This gym is billed through Paddle. Change or cancel its subscription in Paddle instead.",
          "55000",
        );
      }
      const before = snapshot(t.sub);
      t.sub = {
        status: "active",
        plan_tier: String(args.p_plan_tier),
        payment_provider: "manual",
        payment_reference: null,
        amount: 0,
        currency: t.sub?.currency ?? "AED",
        trial_end: null,
        current_period_end: (args.p_until as string | null) ?? null,
      };
      audit.push({
        id: auditId++, created_at: new Date().toISOString(), actor_email: "owner@mtdrb.example",
        action: "grant_access", tenant_id: t.id, tenant_name: t.name,
        details: { reason, before, after: snapshot(t.sub) },
      });
      return { error: null, data: { tenant_id: t.id, access_state: accessState(t.sub) } };
    }

    case "platform_revoke_access": {
      const t = tenants.find((x) => x.id === args.p_tenant_id);
      if (!t) return fail("Tenant not found", "P0002");
      if (!t.sub || t.sub.payment_provider !== "manual") {
        return fail("Only manually granted access can be revoked here", "55000");
      }
      const before = snapshot(t.sub);
      t.sub = { ...t.sub, status: "cancelled", current_period_end: new Date().toISOString() };
      audit.push({
        id: auditId++, created_at: new Date().toISOString(), actor_email: "owner@mtdrb.example",
        action: "revoke_access", tenant_id: t.id, tenant_name: t.name,
        details: { reason: String(args.p_reason ?? ""), before, after: snapshot(t.sub) },
      });
      return { error: null, data: { tenant_id: t.id, access_state: accessState(t.sub) } };
    }

    case "platform_add_note": {
      const t = tenants.find((x) => x.id === args.p_tenant_id);
      if (!t) return fail("Tenant not found", "P0002");
      audit.push({
        id: auditId++, created_at: new Date().toISOString(), actor_email: "owner@mtdrb.example",
        action: "note", tenant_id: t.id, tenant_name: t.name, details: { note: String(args.p_note ?? "") },
      });
      return { error: null, data: { tenant_id: t.id } };
    }

    case "platform_suspend_gym": {
      const t = tenants.find((x) => x.id === args.p_tenant_id);
      const bad = badReason(args);
      if (bad) return bad;
      if (!t) return fail("Tenant not found", "P0002");
      if (suspensions.has(t.id)) return fail("This gym is already suspended", "55000");
      suspensions.set(t.id, { suspended_at: new Date().toISOString(), reason: String(args.p_reason).trim() });
      const banned = staffOf(t).length;
      logAudit("suspend_gym", t, { reason: String(args.p_reason).trim(), staff: banned, banned_users: banned });
      return { error: null, data: { tenant_id: t.id, suspended: true, banned_users: banned } };
    }

    case "platform_unsuspend_gym": {
      const t = tenants.find((x) => x.id === args.p_tenant_id);
      const bad = badReason(args);
      if (bad) return bad;
      if (!t) return fail("Tenant not found", "P0002");
      if (!suspensions.has(t.id)) return fail("This gym is not suspended", "55000");
      suspensions.delete(t.id);
      logAudit("unsuspend_gym", t, { reason: String(args.p_reason).trim(), unbanned_users: staffOf(t).length });
      return { error: null, data: { tenant_id: t.id, suspended: false } };
    }

    case "platform_delete_gym": {
      const t = tenants.find((x) => x.id === args.p_tenant_id);
      const bad = badReason(args);
      if (bad) return bad;
      if (!t) return fail("Tenant not found", "P0002");
      if (String(args.p_confirm_name ?? "").trim() !== t.name) {
        return fail("The confirmation name does not match this gym");
      }
      if (t.sub?.payment_provider === "paddle" && ["active", "trialing", "past_due"].includes(t.sub.status)) {
        return fail("Cancel this gym's Paddle subscription before deleting it", "55000");
      }
      const emails = staffOf(t).map((u) => u.email);
      const deleted = args.p_delete_users ? emails : [];
      logAudit("delete_gym", t, {
        reason: String(args.p_reason).trim(),
        usage: { staff: emails.length, members: t.members, trainers: t.trainers, branches: t.branches, classes: t.classes },
        deleted_users: deleted,
        kept_users: emails.length - deleted.length,
      });
      suspensions.delete(t.id);
      tenants.splice(tenants.indexOf(t), 1);
      return { error: null, data: { tenant_id: t.id, deleted: true, deleted_users: deleted.length } };
    }

    case "platform_ban_user":
    case "platform_unban_user":
    case "platform_reset_user_mfa": {
      const bad = badReason(args);
      if (bad) return bad;
      const found = findUser(args.p_user_id);
      if (!found) return fail("User not found", "P0002");
      const flags = userFlags.get(found.user.user_id) ?? {};
      const email = found.user.email;
      const reason = String(args.p_reason).trim();
      if (name === "platform_ban_user") {
        if (found.user.banned) return fail("This user is already banned", "55000");
        userFlags.set(found.user.user_id, { ...flags, banned: true });
        logAudit("ban_user", found.tenant, { reason, email });
        return { error: null, data: { user_id: found.user.user_id, banned: true } };
      }
      if (name === "platform_unban_user") {
        if (suspensions.has(found.tenant.id)) {
          return fail("This user's gym is suspended; unsuspend the gym instead", "55000");
        }
        if (!found.user.banned) return fail("This user is not banned", "55000");
        userFlags.set(found.user.user_id, { ...flags, banned: false });
        logAudit("unban_user", found.tenant, { reason, email });
        return { error: null, data: { user_id: found.user.user_id, banned: false } };
      }
      if (flags.mfa === false) return fail("This user has no MFA factors to reset", "55000");
      userFlags.set(found.user.user_id, { ...flags, mfa: false });
      logAudit("reset_mfa", found.tenant, { reason, email, factors_removed: 1 });
      return { error: null, data: { user_id: found.user.user_id, factors_removed: 1 } };
    }

    case "platform_change_user_role": {
      const bad = badReason(args);
      if (bad) return bad;
      const role = String(args.p_role ?? "");
      if (!["admin", "employee", "trainer"].includes(role)) return fail("Unknown role");
      const found = findUser(args.p_user_id);
      if (!found || found.tenant.id !== args.p_tenant_id) return fail("This user is not on this gym's staff", "P0002");
      if (found.user.role === role) return fail("This user already has that role", "55000");
      const otherAdmin = staffOf(found.tenant).some((u) => u.role === "admin" && u.user_id !== found.user.user_id);
      if (found.user.role === "admin" && !otherAdmin) return fail("Cannot demote the last admin of a gym", "55000");
      userFlags.set(found.user.user_id, { ...(userFlags.get(found.user.user_id) ?? {}), role });
      logAudit("change_role", found.tenant, {
        reason: String(args.p_reason).trim(), email: found.user.email, from: found.user.role, to: role,
      });
      return { error: null, data: { user_id: found.user.user_id, tenant_id: found.tenant.id, role } };
    }

    case "platform_delete_user": {
      const bad = badReason(args);
      if (bad) return bad;
      const found = findUser(args.p_user_id);
      if (!found) return fail("User not found", "P0002");
      if (String(args.p_confirm_email ?? "").trim().toLowerCase() !== found.user.email.toLowerCase()) {
        return fail("The confirmation email does not match this user");
      }
      const others = staffOf(found.tenant).filter((u) => u.user_id !== found.user.user_id && u.role === "admin");
      if (found.user.role === "admin" && others.length === 0) {
        return fail("This user is the only admin of a gym. Promote another user first, or delete the gym", "55000");
      }
      deletedUsers.add(found.user.user_id);
      logAudit("delete_user", found.tenant, {
        reason: String(args.p_reason).trim(), email: found.user.email,
        reassigned_to: others[0]?.email ?? null, reassigned: {},
      });
      return { error: null, data: { user_id: found.user.user_id, deleted: true, reassigned: 0 } };
    }

    default:
      // Deliberately NOT the analytics fallback the generic mock uses: an
      // unknown platform_* call must surface as an error, never as data.
      return fail(`Mock backend has no ${name}`, "MOCK");
  }
}
