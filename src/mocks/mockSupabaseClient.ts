/**
 * Temporary mock Supabase client for localhost UI preview.
 * Remove when connecting to the real backend.
 */

import type { User, UserAttributes } from "@supabase/supabase-js";
import { DEMO_PLANS, DEMO_TABLES, DEMO_TENANT_ID } from "./demoData";
import { mockInviteGym, mockPlatformRpc } from "./platformAdminMock";
import { mockInviteStaff, mockRoleRows, mockStaffRpc } from "./staffMock";
import { mockPosRpc } from "./posMock";
import { demoSubscriptionRows, mockBillingInfo, mockChangePlan } from "./demoPlan";

type Filter =
  | { kind: "eq"; field: string; value: unknown }
  | { kind: "neq"; field: string; value: unknown }
  | { kind: "gte"; field: string; value: unknown }
  | { kind: "lte"; field: string; value: unknown }
  | { kind: "lt"; field: string; value: unknown }
  | { kind: "gt"; field: string; value: unknown }
  | { kind: "is"; field: string; value: unknown }
  | { kind: "in"; field: string; value: unknown[] }
  | { kind: "or"; expr: string }
  | { kind: "not"; field: string; operator: string; value: unknown };

const MOCK_USER: User = {
  id: "mock-user-localhost",
  aud: "authenticated",
  role: "authenticated",
  email: "dev@localhost.local",
  email_confirmed_at: new Date().toISOString(),
  phone: "",
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {
    tenant_id: DEMO_TENANT_ID,
    paid: true,
    role: "admin",
    subscription_tier: "enterprise",
    onboarding_completed: true,
    name: "Local Dev User",
  },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
} as User;

let currentMockUser = { ...MOCK_USER };

const getMockUser = (): User | null => {
  if (typeof window !== "undefined") {
    const loggedIn = sessionStorage.getItem("mock_logged_in");
    if (loggedIn === "false") {
      return null;
    }
    if (loggedIn === "true") {
      return currentMockUser;
    }
    
    // If it's not set (first load), check the current path
    const path = window.location.pathname;
    const publicRoutes = ["/", "/login", "/signup"];
    if (publicRoutes.includes(path)) {
      return null;
    }
    
    // For protected routes, default to logged in (bypass auth)
    sessionStorage.setItem("mock_logged_in", "true");
    return currentMockUser;
  }
  return currentMockUser;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

type MockRow = Record<string, unknown>;
type MockTableStore = Record<string, MockRow[]>;

// Keep localhost writes in memory for the lifetime of the app session. The
// demo data remains the initial seed, while reads after a write observe the
// same mutable state instead of reloading the seed on every query.
const MOCK_TABLE_STORE_KEY = "mtdrb.mockTableStore";
let mockTableStore: MockTableStore | null = null;

function getMockTableStore(): MockTableStore {
  if (mockTableStore) return mockTableStore;

  if (typeof window !== "undefined") {
    const persistedStore = window.sessionStorage.getItem(MOCK_TABLE_STORE_KEY);
    if (persistedStore) {
      try {
        const parsedStore = JSON.parse(persistedStore) as MockTableStore;
        if (parsedStore && typeof parsedStore === "object") {
          mockTableStore = parsedStore;
        }
      } catch {
        window.sessionStorage.removeItem(MOCK_TABLE_STORE_KEY);
      }
    }
  }

  mockTableStore ??= {};
  return mockTableStore;
}

function persistMockTableStore(): void {
  if (typeof window !== "undefined" && mockTableStore) {
    window.sessionStorage.setItem(
      MOCK_TABLE_STORE_KEY,
      JSON.stringify(mockTableStore),
    );
  }
}

function getMutableTableRows(table: string): MockRow[] {
  const store = getMockTableStore();
  if (!(table in store)) {
    store[table] = clone(DEMO_TABLES[table] ?? []) as MockRow[];
  }
  return store[table];
}

function getTableRows(table: string): MockRow[] {
  // Custom roles live in the staff mock so the Team & roles screen can edit them.
  if (table === "tenant_roles") return mockRoleRows() as MockRow[];
  // The plan the demo gym is on (a test or the console picks it), when one was picked.
  if (table === "platform_subscriptions") return demoSubscriptionRows() as MockRow[];
  return clone(getMutableTableRows(table));
}

/** Splits "a,b(c,d),e" at the commas that are not inside parentheses. */
function splitTopLevel(expr: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of expr) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);
  return parts;
}

/** One PostgREST condition ("field.op.value", or and(...) / or(...) of them) against a row. */
function matchesCondition(row: Record<string, unknown>, condition: string): boolean {
  const group = /^(and|or)\((.*)\)$/.exec(condition);
  if (group) {
    const inner = splitTopLevel(group[2]);
    return group[1] === "and"
      ? inner.every((c) => matchesCondition(row, c))
      : inner.some((c) => matchesCondition(row, c));
  }
  const match = /^(\w+)\.(\w+)\.(.*)$/.exec(condition);
  if (!match) return false;
  const [, field, op, raw] = match;
  const v = row[field];
  switch (op) {
    case "ilike": {
      const pattern = raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*");
      return new RegExp(`^${pattern}$`, "i").test(String(v ?? ""));
    }
    case "is":
      return raw === "null" ? v == null : v != null;
    case "eq":
      return v != null && String(v) === raw;
    case "neq":
      return String(v) !== raw;
    case "gt":
      return v != null && String(v) > raw;
    case "gte":
      return v != null && String(v) >= raw;
    case "lt":
      return v != null && String(v) < raw;
    case "lte":
      return v != null && String(v) <= raw;
    default:
      return false;
  }
}

function matchesOr(row: Record<string, unknown>, expr: string): boolean {
  return splitTopLevel(expr).some((condition) => matchesCondition(row, condition));
}

function applyFilters(
  rows: Record<string, unknown>[],
  filters: Filter[],
): Record<string, unknown>[] {
  return rows.filter((row) =>
    filters.every((f) => {
      switch (f.kind) {
        case "eq":
          return row[f.field] === f.value;
        case "neq":
          return row[f.field] !== f.value;
        case "gte": {
          const v = row[f.field];
          return v != null && String(v) >= String(f.value);
        }
        case "lte": {
          const v = row[f.field];
          return v != null && String(v) <= String(f.value);
        }
        case "lt": {
          const v = row[f.field];
          return v != null && String(v) < String(f.value);
        }
        case "gt": {
          const v = row[f.field];
          return v != null && String(v) > String(f.value);
        }
        case "is":
          return f.value === null ? row[f.field] == null : row[f.field] != null;
        case "in":
          return (f.value as unknown[]).includes(row[f.field]);
        case "or":
          return matchesOr(row, f.expr);
        case "not": {
          const v = row[f.field];
          if (f.operator === "is" && f.value === null) return v != null;
          if (f.operator === "eq") return v !== f.value;
          return true;
        }
        default:
          return true;
      }
    }),
  );
}

class MockQueryBuilder implements PromiseLike<{ data: unknown; error: unknown; count?: number }> {
  private table: string;
  private filters: Filter[] = [];
  private orders: Array<{ field: string; asc: boolean }> = [];
  private wantCount = false;
  private headOnly = false;
  private limitN?: number;
  private rangeFrom?: number;
  private rangeTo?: number;
  private wantSingle = false;
  private allowEmptySingle = false;
  private op: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload?: unknown;
  private columns = "";

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string, options?: { count?: string; head?: boolean }) {
    this.columns = columns ?? "";
    this.wantCount = Boolean(options?.count);
    this.headOnly = Boolean(options?.head);
    if (this.op !== "insert" && this.op !== "update" && this.op !== "upsert") {
      this.op = "select";
    }
    return this;
  }

  insert(data: unknown) {
    this.op = "insert";
    this.payload = data;
    return this;
  }

  update(data: unknown) {
    this.op = "update";
    this.payload = data;
    return this;
  }

  upsert(data: unknown) {
    this.op = "upsert";
    this.payload = data;
    return this;
  }

  delete() {
    this.op = "delete";
    return this;
  }

  eq(field: string, value: unknown) {
    this.filters.push({ kind: "eq", field, value });
    return this;
  }

  neq(field: string, value: unknown) {
    this.filters.push({ kind: "neq", field, value });
    return this;
  }

  gte(field: string, value: unknown) {
    this.filters.push({ kind: "gte", field, value });
    return this;
  }

  lte(field: string, value: unknown) {
    this.filters.push({ kind: "lte", field, value });
    return this;
  }

  gt(field: string, value: unknown) {
    this.filters.push({ kind: "gt", field, value });
    return this;
  }

  is(field: string, value: unknown) {
    this.filters.push({ kind: "is", field, value });
    return this;
  }

  lt(field: string, value: unknown) {
    this.filters.push({ kind: "lt", field, value });
    return this;
  }

  in(field: string, values: unknown[]) {
    this.filters.push({ kind: "in", field, value: values });
    return this;
  }

  or(expr: string) {
    this.filters.push({ kind: "or", expr });
    return this;
  }

  not(field: string, operator: string, value: unknown) {
    this.filters.push({ kind: "not", field, operator, value });
    return this;
  }

  order(field: string, opts?: { ascending?: boolean }) {
    this.orders.push({ field, asc: opts?.ascending ?? true });
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  single() {
    this.wantSingle = true;
    this.allowEmptySingle = false;
    return this;
  }

  maybeSingle() {
    this.wantSingle = true;
    this.allowEmptySingle = true;
    return this;
  }

  private execute(): { data: unknown; error: unknown; count?: number } {
    if (this.op === "insert" || this.op === "upsert") {
      const incomingRows = (Array.isArray(this.payload) ? this.payload : [this.payload]).filter(
        (row): row is MockRow => Boolean(row) && typeof row === "object",
      );
      const tableRows = getMutableTableRows(this.table);
      const returnedRows: MockRow[] = [];

      for (const incomingRow of incomingRows) {
        let existingIndex = -1;
        if (this.op === "upsert") {
          const conflictField = incomingRow.tenant_id != null ? "tenant_id" : "id";
          if (incomingRow[conflictField] != null) {
            existingIndex = tableRows.findIndex(
              (row) => row[conflictField] === incomingRow[conflictField],
            );
          }
        }

        if (existingIndex >= 0) {
          tableRows[existingIndex] = { ...tableRows[existingIndex], ...clone(incomingRow) };
          returnedRows.push(clone(tableRows[existingIndex]));
        } else {
          const insertedRow = clone(incomingRow);
          // The database fills in the key and the creation time; lists sorted by newest rely on them.
          if (insertedRow.id == null) insertedRow.id = globalThis.crypto.randomUUID();
          if (insertedRow.created_at == null) insertedRow.created_at = new Date().toISOString();
          tableRows.push(insertedRow);
          returnedRows.push(clone(insertedRow));
        }
      }

      persistMockTableStore();
      return {
        data: this.wantSingle ? returnedRows[0] ?? null : returnedRows,
        error: null,
      };
    }

    if (this.op === "update") {
      const tableRows = getMutableTableRows(this.table);
      const updatedRows: MockRow[] = [];
      for (let index = 0; index < tableRows.length; index += 1) {
        if (!applyFilters([tableRows[index]], this.filters).length) continue;
        tableRows[index] = { ...tableRows[index], ...(this.payload as object) };
        updatedRows.push(clone(tableRows[index]));
      }
      persistMockTableStore();
      return {
        data: this.wantSingle ? updatedRows[0] ?? null : updatedRows,
        error: null,
      };
    }

    if (this.op === "delete") {
      const tableRows = getMutableTableRows(this.table);
      const deletedRows = tableRows.filter(
        (row) => applyFilters([row], this.filters).length > 0,
      );
      getMockTableStore()[this.table] = tableRows.filter(
        (row) => applyFilters([row], this.filters).length === 0,
      );
      persistMockTableStore();
      return {
        data: this.wantSingle ? clone(deletedRows[0] ?? null) : clone(deletedRows),
        error: null,
      };
    }

    let rows = applyFilters(getTableRows(this.table), this.filters);

    if (this.orders.length > 0) {
      const orders = this.orders;
      rows.sort((a, b) => {
        for (const { field, asc } of orders) {
          const cmp = String(a[field] ?? "").localeCompare(String(b[field] ?? ""));
          if (cmp !== 0) return asc ? cmp : -cmp;
        }
        return 0;
      });
    }

    // `members(...)` in the select list joins the member a row points at (the
    // database does this through the foreign key; seeded rows already embed it).
    if (/\bmembers\(/.test(this.columns)) {
      const members = getTableRows("members");
      rows = rows.map((row) => {
        if (row.members || !row.member_id) return row;
        const member = members.find((m) => m.id === row.member_id);
        return member
          ? { ...row, members: { id: member.id, first_name: member.first_name, last_name: member.last_name, email: member.email } }
          : row;
      });
    }

    // The count PostgREST reports ignores paging; a head request returns no rows.
    const total = rows.length;
    if (this.headOnly) return { data: null, error: null, count: total };

    if (this.rangeFrom != null && this.rangeTo != null) {
      rows = rows.slice(this.rangeFrom, this.rangeTo + 1);
    } else if (this.limitN != null) {
      rows = rows.slice(0, this.limitN);
    }

    if (this.wantSingle) {
      if (rows.length === 0) {
        return {
          data: null,
          error: this.allowEmptySingle
            ? null
            : { code: "PGRST116", message: "No rows found" },
        };
      }
      return { data: rows[0], error: null };
    }

    return { data: rows, error: null, ...(this.wantCount ? { count: total } : { count: rows.length }) };
  }

  then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

function mockRpc(name: string): { data: unknown; error: null } {
  const overview = {
    total_members: 248,
    active_members: 210,
    total_revenue: 187500,
    monthly_growth: 12.4,
    class_utilization: 82,
    member_retention: 91,
  };
  const rpcMap: Record<string, unknown> = {
    get_analytics_overview: overview,
    get_member_metrics: { new_members: 18, churned: 3, retention_rate: 91 },
    get_trainer_metrics: { avg_rating: 4.8, total_classes: 156 },
    get_class_metrics: { utilization: 82, cancellations: 4 },
    get_financial_metrics: { revenue: 187500, expenses: 81700, profit: 105800 },
    get_vat_dashboard_data: {
      vat_collected: 12450,
      vat_paid: 3200,
      compliance_score: 94,
    },
    calculate_vat_compliance_score: 94,
    generate_vat_return: { id: "vr-mock", status: "draft" },
    create_tenant_with_membership: DEMO_TENANT_ID,
  };
  return { data: rpcMap[name] ?? overview, error: null };
}

const isoDay = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/**
 * Membership plans in the demo: enough to click through assigning a plan. Nothing
 * is stored - the real rules (dates in the gym's calendar, invoices) live in the
 * database function assign_member_plan().
 */
function mockMembershipRpc(
  name: string,
  args: Record<string, unknown> = {},
): { data: unknown; error: { message: string; code?: string } | null } | undefined {
  if (name === "plan_member_counts") {
    return { data: DEMO_PLANS.map((p) => ({ plan_id: p.id, members: p.members_count })), error: null };
  }
  if (name !== "assign_member_plan") return undefined;

  const plan = DEMO_PLANS.find((p) => p.id === args.p_plan_id);
  if (!plan) return { data: null, error: { message: "Plan not found", code: "P0002" } };
  const start = typeof args.p_start === "string" ? new Date(`${args.p_start}T00:00:00`) : new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + plan.duration - 1);
  const price = typeof args.p_price === "number" ? args.p_price : plan.price;
  return {
    data: {
      invoice_id: args.p_invoice !== false && price > 0 ? "demo-invoice" : null,
      member_id: args.p_member_id,
      plan_id: plan.id,
      plan_name: plan.name,
      start_date: isoDay(start),
      expiry_date: isoDay(end),
      price,
      renewed: args.p_renew === true,
    },
    error: null,
  };
}

/**
 * Creates a mock Supabase client that returns hardcoded demo data.
 */
export function createMockSupabaseClient() {
  const noopSub = { unsubscribe: () => {} };

  return {
    from: (table: string) => new MockQueryBuilder(table),
    rpc: (name: string, args?: Record<string, unknown>) =>
      Promise.resolve(mockPlatformRpc(name, args) ?? mockStaffRpc(name, args) ?? mockMembershipRpc(name, args) ?? mockPosRpc(name, args, { rows: getMutableTableRows, persist: persistMockTableStore }) ?? mockRpc(name)),
    channel: () => ({
      on: () => ({ subscribe: () => noopSub }),
      subscribe: () => noopSub,
    }),
    removeChannel: () => {},
    functions: {
      invoke: async (name: string, options?: { body?: unknown }) =>
        name === "platform-invite-gym"
          ? mockInviteGym(options?.body)
          : name === "invite-staff"
            ? mockInviteStaff(options?.body)
            : name === "paddle-change-plan"
              ? mockChangePlan(options?.body)
              : name === "paddle-billing-info"
                ? mockBillingInfo(options?.body)
                : { data: null, error: new Error(`Mock backend has no function ${name}`) },
    },
    auth: {
      getUser: async () => ({ data: { user: getMockUser() }, error: null }),
      getSession: async () => {
        const user = getMockUser();
        return {
          data: {
            session: user
              ? {
                  user,
                  access_token: "mock-token",
                  refresh_token: "mock-refresh",
                  expires_at: Math.floor(Date.now() / 1000) + 3600,
                }
              : null,
          },
          error: null,
        };
      },
      refreshSession: async () => {
        const user = getMockUser();
        return {
          data: { session: user ? { user } : null },
          error: null,
        };
      },
      resetPasswordForEmail: async () => ({ data: {}, error: null }),
      updateUser: async (attributes?: UserAttributes) => {
        if (attributes?.data) {
          currentMockUser = {
            ...currentMockUser,
            user_metadata: {
              ...currentMockUser.user_metadata,
              ...attributes.data,
            },
          };
        }
        return { data: { user: currentMockUser }, error: null };
      },
      signInWithPassword: async () => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("mock_logged_in", "true");
        }
        currentMockUser = {
          ...MOCK_USER,
          user_metadata: {
            ...MOCK_USER.user_metadata,
            paid: true,
            onboarding_completed: true,
          },
        };
        return {
          data: {
            user: currentMockUser,
            session: {
              user: currentMockUser,
              access_token: "mock-token",
              refresh_token: "mock-refresh",
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            },
          },
          error: null,
        };
      },
      signUp: async () => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("mock_logged_in", "true");
        }
        currentMockUser = {
          ...MOCK_USER,
          user_metadata: {
            ...MOCK_USER.user_metadata,
            paid: false,
            onboarding_completed: false,
          },
        };
        return {
          data: {
            user: currentMockUser,
            session: {
              user: currentMockUser,
              access_token: "mock-token",
              refresh_token: "mock-refresh",
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            },
          },
          error: null,
        };
      },
      signOut: async () => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("mock_logged_in", "false");
        }
        currentMockUser = { ...MOCK_USER };
        return { error: null };
      },
      onAuthStateChange: (cb?: (event: string, session: unknown) => void) => {
        const user = getMockUser();
        cb?.("INITIAL_SESSION", user ? { user } : null);
        return { data: { subscription: noopSub } };
      },
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: "mock/path.jpg" }, error: null }),
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://placeholder.demo/${path}` },
        }),
      }),
    },
  };
}

export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>;
