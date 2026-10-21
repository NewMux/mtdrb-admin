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
  action: "grant_access" | "revoke_access" | "note";
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
            (filter === "ending_soon" ? endingSoon(t) : accessState(t.sub) === filter)),
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
          subscription: summary(t.sub, true),
          staff: [
            { email: t.admin_email, role: "admin", joined_at: t.created_at, last_sign_in_at: t.admin_last_sign_in },
            { email: `frontdesk@${t.admin_email.split("@")[1]}`, role: "employee", joined_at: t.created_at, last_sign_in_at: ago(2) },
          ],
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

    default:
      // Deliberately NOT the analytics fallback the generic mock uses: an
      // unknown platform_* call must surface as an error, never as data.
      return fail(`Mock backend has no ${name}`, "MOCK");
  }
}
