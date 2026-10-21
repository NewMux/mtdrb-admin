import { describe, expect, it } from "vitest";
import {
  computeGrantUntil,
  describeAuditEntry,
  formatRelativeDays,
  hasPaddleHistory,
  isPaddleManaged,
  isPlatformAdminPath,
  isProTier,
  parsePlatformAdminStatus,
  parseTenantListQuery,
  serializeTenantListQuery,
  TENANT_FILTERS,
  validateGrantInput,
  type GrantInput,
} from "./platformAdmin";

describe("isPlatformAdminPath", () => {
  it("matches the console root and nested routes", () => {
    expect(isPlatformAdminPath("/superadmin")).toBe(true);
    expect(isPlatformAdminPath("/superadmin/")).toBe(true);
    expect(isPlatformAdminPath("/superadmin/tenants")).toBe(true);
    expect(isPlatformAdminPath("/superadmin/tenants/abc")).toBe(true);
  });

  it("respects the path-segment boundary", () => {
    expect(isPlatformAdminPath("/superadminfoo")).toBe(false);
    expect(isPlatformAdminPath("/superadmin-x/tenants")).toBe(false);
    expect(isPlatformAdminPath("/dashboard/superadmin")).toBe(false);
    expect(isPlatformAdminPath("/")).toBe(false);
  });

  it("is false for empty input", () => {
    expect(isPlatformAdminPath("")).toBe(false);
    expect(isPlatformAdminPath(null)).toBe(false);
    expect(isPlatformAdminPath(undefined)).toBe(false);
  });
});

describe("parsePlatformAdminStatus", () => {
  it("passes through only the two documented non-denied values", () => {
    expect(parsePlatformAdminStatus("ok")).toBe("ok");
    expect(parsePlatformAdminStatus("mfa_required")).toBe("mfa_required");
    expect(parsePlatformAdminStatus("not_admin")).toBe("not_admin");
  });

  it("fails closed on anything else, including truthy look-alikes", () => {
    for (const v of [true, 1, "OK", "ok ", {}, { total_members: 248 }, [], null, undefined]) {
      expect(parsePlatformAdminStatus(v)).toBe("not_admin");
    }
  });
});

describe("isProTier", () => {
  it("only pro and enterprise unlock Pro features", () => {
    expect(isProTier("pro")).toBe(true);
    expect(isProTier("enterprise")).toBe(true);
    expect(isProTier("starter")).toBe(false);
    expect(isProTier("demo")).toBe(false);
    expect(isProTier(null)).toBe(false);
  });
});

describe("computeGrantUntil", () => {
  const now = new Date("2026-10-19T10:00:00.000Z");

  it("adds preset durations to now", () => {
    expect(computeGrantUntil("30d", "", now).until).toBe("2026-11-18T10:00:00.000Z");
    expect(computeGrantUntil("14d", "", now).until).toBe("2026-11-02T10:00:00.000Z");
    expect(computeGrantUntil("1y", "", now).until).toBe("2027-10-19T10:00:00.000Z");
  });

  it("returns null for no expiry", () => {
    expect(computeGrantUntil("none", "", now)).toEqual({ until: null });
  });

  it("accepts a future custom date and runs it to the end of that local day", () => {
    const { until, error } = computeGrantUntil("custom", "2026-12-31", now);
    expect(error).toBeUndefined();
    const end = new Date(until as string);
    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(11);
    expect(end.getDate()).toBe(31);
    expect(end.getHours()).toBe(23);
  });

  it("rejects missing, malformed, impossible, past and too-distant custom dates", () => {
    expect(computeGrantUntil("custom", "", now).error).toMatch(/choose/i);
    expect(computeGrantUntil("custom", "31/12/2026", now).error).toMatch(/choose/i);
    expect(computeGrantUntil("custom", "2026-02-31", now).error).toMatch(/valid/i);
    expect(computeGrantUntil("custom", "2026-10-01", now).error).toMatch(/future/i);
    expect(computeGrantUntil("custom", "2040-01-01", now).error).toMatch(/5 years/);
  });
});

describe("validateGrantInput", () => {
  const now = new Date("2026-10-19T10:00:00.000Z");
  const base: GrantInput = {
    durationKey: "30d",
    customDate: "",
    reason: "Founding customer",
    confirmName: "",
    tenantName: "Iron Temple",
  };

  it("accepts a valid preset grant", () => {
    expect(validateGrantInput(base, now)).toEqual({});
  });

  it("requires a reason of 3 to 500 characters", () => {
    expect(validateGrantInput({ ...base, reason: "  a " }, now).reason).toBeDefined();
    expect(validateGrantInput({ ...base, reason: "x".repeat(501) }, now).reason).toBeDefined();
    expect(validateGrantInput({ ...base, reason: "abc" }, now).reason).toBeUndefined();
  });

  it("surfaces date problems under 'duration'", () => {
    expect(
      validateGrantInput({ ...base, durationKey: "custom", customDate: "2020-01-01" }, now).duration,
    ).toMatch(/future/);
  });

  it("requires the gym name to be typed for a no-expiry grant", () => {
    const noExpiry: GrantInput = { ...base, durationKey: "none" };
    expect(validateGrantInput(noExpiry, now).confirmName).toBeDefined();
    expect(validateGrantInput({ ...noExpiry, confirmName: "iron temple " }, now)).toEqual({});
    expect(validateGrantInput({ ...noExpiry, confirmName: "Other Gym" }, now).confirmName).toBeDefined();
  });

  it("does not demand the typed name for expiring grants", () => {
    expect(validateGrantInput({ ...base, confirmName: "" }, now).confirmName).toBeUndefined();
  });
});

describe("Paddle helpers", () => {
  const paddle = {
    status: "active",
    plan_tier: "pro",
    payment_provider: "paddle",
    trial_end: null,
    current_period_end: null,
  };
  const manual = { ...paddle, payment_provider: "manual" };

  it("treats a currently-entitled Paddle subscription as managed by Paddle", () => {
    expect(isPaddleManaged(paddle, "paid")).toBe(true);
    expect(isPaddleManaged(paddle, "trialing")).toBe(true);
  });

  it("does not block a lapsed or cancelled Paddle row, or any manual row", () => {
    expect(isPaddleManaged(paddle, "inactive")).toBe(false);
    expect(isPaddleManaged(manual, "complimentary")).toBe(false);
    expect(isPaddleManaged(null, "awaiting_activation")).toBe(false);
  });

  it("flags any Paddle history for the late-event warning", () => {
    expect(hasPaddleHistory(paddle)).toBe(true);
    expect(hasPaddleHistory(manual)).toBe(false);
    expect(hasPaddleHistory(null)).toBe(false);
  });
});

describe("formatRelativeDays", () => {
  const now = new Date("2026-10-19T10:00:00.000Z");
  it("describes past, present and future", () => {
    expect(formatRelativeDays("2026-10-19T12:00:00.000Z", now)).toBe("today");
    expect(formatRelativeDays("2026-10-24T10:00:00.000Z", now)).toBe("in 5 days");
    expect(formatRelativeDays("2026-10-20T10:00:00.000Z", now)).toBe("in 1 day");
    expect(formatRelativeDays("2026-10-16T10:00:00.000Z", now)).toBe("3 days ago");
    expect(formatRelativeDays(null, now)).toBe("—");
  });
});

describe("tenant list query <-> URL", () => {
  it("falls back to safe defaults for missing or hostile values", () => {
    expect(parseTenantListQuery(new URLSearchParams(""))).toEqual({
      q: "",
      filter: "all",
      sort: "created_desc",
      page: 1,
    });
    const hostile = parseTenantListQuery(
      new URLSearchParams("filter=drop&sort=id;--&page=-3&q=" + "x".repeat(300)),
    );
    expect(hostile.filter).toBe("all");
    expect(hostile.sort).toBe("created_desc");
    expect(hostile.page).toBe(1);
    expect(hostile.q).toHaveLength(100);
  });

  it("round-trips, omitting defaults", () => {
    const query = { q: "iron", filter: "awaiting_activation", sort: "name_asc", page: 3 } as const;
    const params = serializeTenantListQuery(query);
    expect(params.toString()).toBe("q=iron&filter=awaiting_activation&sort=name_asc&page=3");
    expect(parseTenantListQuery(params)).toEqual(query);
    expect(serializeTenantListQuery({ q: "", filter: "all", sort: "created_desc", page: 1 }).toString()).toBe("");
  });
});

describe("describeAuditEntry", () => {
  const base = {
    id: 1,
    created_at: "2026-10-19T10:00:00.000Z",
    actor_email: "owner@x.dev",
    tenant_id: "t1",
    tenant_name: "Iron Temple",
  };

  it("summarises a time-limited and a no-expiry grant", () => {
    const limited = describeAuditEntry({
      ...base,
      action: "grant_access",
      details: { reason: "Pilot", after: { plan_tier: "pro", current_period_end: "2026-12-01T12:00:00.000Z" } },
    });
    expect(limited.title).toMatch(/^Granted Pro access until /);
    expect(limited.detail).toBe("Pilot");

    const forever = describeAuditEntry({
      ...base,
      action: "grant_access",
      details: { reason: "Partner", after: { plan_tier: "enterprise", current_period_end: null } },
    });
    expect(forever.title).toBe("Granted Enterprise access with no expiry");
  });

  it("summarises revokes and notes", () => {
    expect(describeAuditEntry({ ...base, action: "revoke_access", details: { reason: "Pilot over" } })).toEqual({
      title: "Revoked manual access",
      detail: "Pilot over",
    });
    expect(describeAuditEntry({ ...base, action: "note", details: { note: "Called them" } })).toEqual({
      title: "Note",
      detail: "Called them",
    });
  });
  it("summarises gym actions", () => {
    expect(describeAuditEntry({ ...base, action: "suspend_gym", details: { reason: "Chargeback", banned_users: 2 } })).toEqual({
      title: "Suspended gym (2 sign-ins blocked)",
      detail: "Chargeback",
    });
    expect(describeAuditEntry({ ...base, action: "suspend_gym", details: { banned_users: 1 } }).title).toBe(
      "Suspended gym (1 sign-in blocked)",
    );
    expect(describeAuditEntry({ ...base, action: "unsuspend_gym", details: { unbanned_users: 2, reason: "Paid" } })).toEqual({
      title: "Lifted suspension (2 sign-ins restored)",
      detail: "Paid",
    });
    expect(describeAuditEntry({ ...base, action: "delete_gym", details: { deleted_users: ["a@x.dev", "b@x.dev"], reason: "Closing" } })).toEqual({
      title: "Deleted gym and 2 accounts",
      detail: "Closing",
    });
    expect(describeAuditEntry({ ...base, action: "delete_gym", details: { deleted_users: [] } }).title).toBe("Deleted gym");
  });

  it("summarises user actions", () => {
    const d = { email: "sam@x.dev", reason: "Because" };
    expect(describeAuditEntry({ ...base, action: "ban_user", details: d }).title).toBe("Banned sam@x.dev");
    expect(describeAuditEntry({ ...base, action: "unban_user", details: d }).title).toBe("Unbanned sam@x.dev");
    expect(describeAuditEntry({ ...base, action: "reset_mfa", details: d }).title).toBe("Reset MFA for sam@x.dev");
    expect(describeAuditEntry({ ...base, action: "change_role", details: { ...d, from: "employee", to: "admin" } }).title).toBe(
      "Changed sam@x.dev from employee to admin",
    );
  });

  it("says who took over a deleted user's records", () => {
    const entry = describeAuditEntry({
      ...base,
      action: "delete_user",
      details: { email: "sam@x.dev", reason: "Left", reassigned_to: "boss@x.dev", reassigned: { pos_sales: 2, member_tasks: 3 } },
    });
    expect(entry.title).toBe("Deleted sam@x.dev");
    expect(entry.detail).toContain("5 records handed to boss@x.dev");
    expect(entry.detail).toContain("Left");
    expect(describeAuditEntry({ ...base, action: "delete_user", details: { email: "sam@x.dev", reassigned: {} } }).detail).toBeNull();
  });

  it("never throws on an action it does not know", () => {
    expect(describeAuditEntry({ ...base, action: "future_thing" as never, details: {} })).toEqual({ title: "future_thing", detail: null });
  });
});

describe("suspended filter", () => {
  it("is offered and survives a URL round trip", () => {
    expect(TENANT_FILTERS.map((f) => f.value)).toContain("suspended");
    expect(parseTenantListQuery(new URLSearchParams("filter=suspended")).filter).toBe("suspended");
  });
});
